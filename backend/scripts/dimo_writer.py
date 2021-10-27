import json
from pathlib import Path
import shutil
import os

class DimoWriter:

    def save(self, ds, orig_path, path):
        self.clear_path(path)
        self.copy_models(orig_path, path)
        for camera in ds.keys():
            if camera is not 'models':
                self.save_scenes(ds[camera], path / camera)

    def clear_path(self, path):
        try:
            shutil.rmtree(path)
        except OSError as e:
            print("Error: %s - %s." % (e.filename, e.strerror))

    def copy_models(self, orig_path, path):
       shutil.copytree(orig_path / 'models', path / 'models')

    def save_scenes(self, scenes, path):
        for scene in scenes:
            scene_id = scene['id']
            self.save_scene(scene, path / f'{scene_id:06d}')

    def save_scene(self, scene, path):
        path.mkdir(parents=True, exist_ok=True)
        self.save_images(scene, path)
        self.save_scene_gt_world(scene['images'][0]['objects'], path)

    def save_images(self, scene, path):
        scene_camera = {}
        scene_gt = {}
        for image in scene['images']:
            image_id = image['id']
            scene_camera[str(image_id)] = self.create_camera_gt(image['camera']['K'], image['camera']['world_2cam'])
            scene_gt[str(image_id)] = [self.create_pose_gt(obj['id'], obj['model_2cam'], 'cam_R_m2c', 'cam_t_m2c') for obj in image['objects']]
            self.copy_image(image['path'], path / 'rgb' / f'{image_id:06d}.png')
        with open(path / 'scene_camera.json', 'w') as f_scene_camera, \
            open(path / 'scene_gt.json', 'w') as f_scene_gt:
            json.dump(scene_camera, f_scene_camera)
            json.dump(scene_gt, f_scene_gt)

    def create_camera_gt(self, K, T):
        R, t = self.convert_pose(T)
        return {
            'cam_K': K.flatten().tolist(),
            'cam_R_w2c': R,
            'cam_t_w2c': t
        }

    def create_pose_gt(self, obj_id, T, R_label, t_label):
        R, t = self.convert_pose(T)
        return {
           'obj_id': str(obj_id),
           R_label: R,
           t_label: t
        }

    def copy_image(self, orig_path, new_path):
        if not os.path.exists(new_path.parent):
            os.mkdir(new_path.parent)
        shutil.copyfile(orig_path, new_path)

    def save_scene_gt_world(self, objects, path):
        # scene_gt_world = [self.create_pose_gt(obj['id'], obj['model_2world'], 'cam_R_m2w', 'cam_t_m2w') for obj in objects]
        scene_gt_world = [self.create_pose_gt(obj['id'], obj['model_2world'], 'cam_R_m2c', 'cam_t_m2c') for obj in objects]
        with open(path / 'scene_gt_world.json', 'w') as f_scene_gt_world:
            json.dump(scene_gt_world, f_scene_gt_world)

    def convert_pose(self, T):
        R = T[:3, :3].flatten().tolist()
        t = T[:3, 3].flatten().tolist()
        return R, t


# from dimo_loader import DimoLoader

# orig_path = Path('/Users/peterderoovere/Documents/Baekeland/Data.nosync/sample_paper')
# loader = DimoLoader()
# ds = loader.load(orig_path)

# new_path = Path('/Users/peterderoovere/Documents/Baekeland/Data.nosync/sample_paper_2')
# writer = DimoWriter()
# writer.save(ds, orig_path, new_path)
