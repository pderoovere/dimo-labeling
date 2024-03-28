import json
import logging

import numpy as np
from PIL import Image
from scipy.spatial.transform import Rotation


class DatasetLoader:

    def load(self, path, args):
        parts_path = path / args.models_dir
        part_ids = self.load_part_ids(parts_path)
        parts = dict(
            (part_id, self.load_part(path, parts_path, part_id)) for part_id in part_ids
        )
        scenes = self.load_scenes(parts, path, path / args.images_dir, args.mode)
        ds = {"scenes": scenes, "parts": list(parts.values())}
        return ds

    def load_part_ids(self, path):
        with open(path / "models_info.json") as f:
            parts = json.load(f)
            part_ids = [int(part_id) for part_id in parts.keys()]
            return part_ids

    def load_part(self, main_path, path, part_id):
        cad_path = path / f"obj_{part_id:06d}.ply"
        result = {
            "id": part_id,
            "cadPath": str(f"/api/cdn/{cad_path.relative_to(main_path)}"),
            "texturePath": "",
        }
        texture_path = path / f"obj_{part_id:06d}.png"
        if texture_path.exists():
            result["texturePath"] = str(
                f"/api/cdn/{texture_path.relative_to(main_path)}"
            )
        return result

    def load_scenes(self, parts, main_path, path, mode):
        return [
            self.load_scene(parts, main_path, scene_path, mode)
            for scene_path in sorted(path.glob("[!.]*"))
        ]

    def load_scene(self, parts, main_path, path, mode):
        scene_id = path.name
        with open(path / "scene_gt.json") as f_gt, open(
            path / "scene_camera.json"
        ) as f_cam:
            images_gt = json.load(f_gt)
            images_cam = json.load(f_cam)
            images = [
                self.load_image(main_path, path, image_id, images_cam[image_id], mode)
                for image_id in images_gt
            ]
            positioned_parts = self.load_positioned_parts(
                path, parts, images_gt[images[0]["id"]], images
            )
            return {
                "id": scene_id,
                "images": images,
                "positionedParts": positioned_parts,
            }

    def load_image(self, main_path, path, image_id, image_cam, mode):
        if (path / "rgb").exists():
            image_path = path / "rgb" / f"{int(image_id):06d}.png"
        elif (path / "gray").exists():
            image_path = path / "gray" / f"{int(image_id):06d}.png"
        elif (path / "color").exists():
            image_path = path / "color" / f"{int(image_id):06d}.png"
        else:
            raise Exception(f"Cannot find image {image_id} in {path}")
        image = Image.open(image_path)
        K = self.load_intrinsics(image_cam["cam_K"])
        camera_pose = self.load_inv_pose(image_cam["cam_R_w2c"], image_cam["cam_t_w2c"])
        if mode == "dimo":
            camera_pose = self.load_pose(image_cam["cam_R_m2c"], image_cam["cam_t_m2c"])
        return {
            "id": image_id,
            "path": str(f"/api/cdn/{image_path.relative_to(main_path)}"),
            "width": image.size[0],
            "height": image.size[1],
            "cameraMatrix": K,
            "cameraPose": camera_pose,
        }

    def load_positioned_parts(self, path, parts, image_gt, images):
        if (path / "scene_gt_world.json").exists():
            logging.info("loading parts w.r.t world")
            with open(path / "scene_gt_world.json") as f_positioned_parts:
                positioned_parts_gt = json.load(f_positioned_parts)
                positioned_parts = [
                    self.load_positioned_part(
                        parts, positioned_part_gt, "cam_R_m2w", "cam_t_m2w"
                    )
                    for positioned_part_gt in positioned_parts_gt
                ]
        else:
            logging.info("loading parts w.r.t camera")
            positioned_parts = [
                self.load_positioned_part(
                    parts, image_part_gt, "cam_R_m2c", "cam_t_m2c"
                )
                for image_part_gt in image_gt
            ]
            self.convert_positioned_parts_from_camera_to_world(
                positioned_parts, images[0]["cameraPose"]
            )
        return positioned_parts

    def load_positioned_part(self, parts, image_part_gt, key_R, key_t):
        part_id = int(image_part_gt["obj_id"])
        pose = self.load_pose(image_part_gt[key_R], image_part_gt[key_t])
        return {"part": parts[part_id], "pose": pose}

    def convert_positioned_parts_from_camera_to_world(
        self, positioned_parts, camera_2world
    ):
        for positioned_part in positioned_parts:
            pose = self.list_to_pose(camera_2world) @ self.list_to_pose(
                positioned_part["pose"]
            )
            positioned_part["pose"] = self.pose_to_list(pose)

    def load_intrinsics(self, K):
        K = np.reshape(K, (3, 3))
        return K.flatten(order="F").tolist()

    def load_pose(self, R, t):
        T = np.eye(4, 4)
        T[:3, :3] = np.reshape(R, (3, 3))
        T[:3, 3] = t
        return self.pose_to_list(T)

    def load_inv_pose(self, R, t):
        T = np.eye(4, 4)
        T[:3, :3] = np.reshape(R, (3, 3))
        T[:3, 3] = t
        T = np.linalg.inv(T)
        return self.pose_to_list(T)

    def list_to_pose(self, l):
        return np.array(l).reshape((4, 4), order="F")

    def pose_to_list(self, T):
        return T.flatten(order="F").tolist()

    def xyzwpr_from_T(self, T):
        [x, y, z] = T[:3, 3]
        [w, p, r] = Rotation.from_matrix(T[:3, :3]).as_euler("xyz", degrees=True)
        return {"x": x, "y": y, "z": z, "w": w, "p": p, "r": r}

    @staticmethod
    def add_to_argparse(parser):
        parser.add_argument(
            "--models_dir",
            type=str,
            default=r"models",
            help="Name of the directory (relative to the dataset path) where the models are stored.",
        )
        parser.add_argument(
            "--images_dir",
            type=str,
            default=r"real_jaigo",
            help="Name of the directory (relative to the dataset path) where scenes are stored.",
        )
        parser.add_argument(
            "--mode",
            type=str,
            default=r"bop",
            help="Dataset mode, bop = BOP dataset, dimo = DIMO dataset.",
        )
        return parser
