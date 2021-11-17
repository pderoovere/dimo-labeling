import json
import logging

import numpy as np
from scipy.spatial.transform import Rotation


class DatasetSaver:

    def save(self, path, args, data):
        for scene_data in data:
            self.save_scene_data(path / args.images_dir, scene_data)
        logging.info(f'saved {path / args.images_dir}')

    def save_scene_data(self, path, scene_data):
        _id = scene_data['id']
        positioned_parts = scene_data['positionedParts']
        converted_data = dict([self.convert_image_data(image_data, positioned_parts) for image_data in
                               scene_data['images']])
        with open(path / _id / 'scene_gt.json', 'w') as f:
            json.dump(converted_data, f)
        with open(path / _id / 'scene_gt_world.json', 'w') as f:
            gt_world = [self.convert_positioned_part_world(positioned_part) for positioned_part in positioned_parts]
            json.dump(gt_world, f)

    def convert_image_data(self, image_data, positioned_parts):
        _id = image_data['id']
        camera_pose = self.list_to_pose(image_data['cameraPose'])
        converted_parts = [self.convert_positioned_part(positioned_part, camera_pose) for positioned_part in
                           positioned_parts]
        return str(_id), converted_parts

    def list_to_pose(self, l):
        return np.array(l).reshape((4, 4), order='F')

    def pose_to_list(self, T):
        return T.flatten(order='F').tolist()

    def convert_positioned_part(self, positioned_part, camera_pose):
        part_2world = self.list_to_pose(positioned_part['pose'])
        part_2cam = np.linalg.pinv(camera_pose) @ part_2world
        part_id = positioned_part['part']['id']
        return self.convert_data(part_2cam, part_id, 'cam_R_m2c', 'cam_t_m2c')

    def convert_positioned_part_world(self, positioned_part):
        pose = self.list_to_pose(positioned_part['pose'])
        part_id = positioned_part['part']['id']
        return self.convert_data(pose, part_id, 'cam_R_m2w', 'cam_t_m2w')

    def convert_data(self, pose, part_id, key_R, key_t):
        pose_R = self.pose_to_R(pose)
        pose_t = self.pose_to_t(pose)
        return {
            key_R: pose_R,
            key_t: pose_t,
            'obj_id': part_id
        }

    def xyzwpr_from_T(self, T):
        [x, y, z] = T[:3, 3]
        [w, p, r] = Rotation.from_matrix(T[:3, :3].T).as_euler('xyz', degrees=True)
        return x, y, z, w, p, r

    def T_from_xyzwpr(self, x=0., y=0., z=0., w=0., p=0., r=0.):
        T = np.eye(4, 4)
        T[:3, :3] = Rotation.from_euler('xyz', [w, p, r], degrees=True).as_matrix()
        T[:3, 3] = [x, y, z]
        return T

    def pose_to_R(self, pose):
        return pose[:3, :3].flatten().tolist()

    def pose_to_t(self, pose):
        return pose[:3, 3].flatten().tolist()
