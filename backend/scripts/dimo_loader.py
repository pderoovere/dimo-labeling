import json

from pathlib import Path

import numpy as np
from scipy.spatial.transform import Rotation


class DimoLoader:

    def load(self, path, models_dir = 'models', cameras = ['real_jaigo']):
        result = {}
        result['models'] = self.load_models(path / models_dir)
        for camera in cameras:
            result[camera] = self.load_scenes(path / camera)
        return result

    def load_models(self, path):
        with open(path / 'models_info.json') as f:
            models = json.load(f)
            result = []
            for model_id, model in models.items():
                model_id = int(model_id) # convert id from str to int
                model['cad'] = path / f'obj_{int(model_id):06d}.ply' # add cad path
                model['id'] = model_id
                result.append(model)
            return result

    def load_scenes(self, path):
        return [self.load_scene(path) for path in sorted(path.glob('[!.]*'))]

    def load_scene(self, path):
        scene_id = int(path.name)
        result = {
            "id": scene_id
        }
        images = []
        with open(path / 'scene_camera.json') as f_scene_camera, \
            open(path / 'scene_gt.json') as f_scene_gt, \
            open(path / 'scene_gt_world.json') as f_scene_gt_world:
            # open(path / 'scene_info.json') as f_scene_info, \
            scene_camera = json.load(f_scene_camera)
            scene_gt = json.load(f_scene_gt)
            scene_gt_world = json.load(f_scene_gt_world)
            # scene_info = json.load(f_scene_info)
            assert scene_camera.keys() == scene_gt.keys(), "labels are not consistent for all images"
            for image_id in scene_camera.keys():
                images.append(self.load_image(path, int(image_id), scene_camera[image_id], scene_gt[image_id], scene_gt_world))
        result['images'] = images
        return result

    def load_image(self, scene_path, image_id, camera, scene_gt, scene_gt_world):
        return {
            'id': image_id,
            'path': scene_path / 'rgb' / f'{int(image_id):06d}.png',
            'camera': self.load_camera(camera),
            'scene_info': None, #TODO
            'objects': self.load_objects(scene_gt, scene_gt_world)
        }
        
    def load_camera(self, camera):
        K = np.reshape(camera['cam_K'], (3, 3))
        T = self.load_pose(camera['cam_R_w2c'], camera['cam_t_w2c'])
        return {
            'K': K,
            'world_2cam': T
        }

    def load_objects(self, scene_gt, scene_gt_world):
        result = []
        for o, o_world in zip(scene_gt, scene_gt_world):
            assert o['obj_id'] == o_world['obj_id']
            result.append({
                'id': int(o['obj_id']),
                'model_2cam': self.load_pose(o['cam_R_m2c'], o['cam_t_m2c']),
                'model_2world': self.load_pose(o_world['cam_R_m2c'], o_world['cam_t_m2c'])
            })
        return result

    def load_pose(self, R, t):
        T = np.eye(4, 4)
        T[:3, :3] = np.reshape(R, (3, 3))
        T[:3, 3] = t
        return T

#path = Path("/Users/peterderoovere/Desktop/sample_paper")
#loader = DimoLoader()
#loader.load(path)