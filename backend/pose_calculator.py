import cv2
import numpy as np
from scipy.spatial.transform import Rotation


class PoseCalculator:

    def calc_pose(self, points, pixels, camera_matrix):
        points = np.array(points).astype(np.float32)
        pixels = np.array(pixels).astype(np.float32)
        camera_matrix = np.array(camera_matrix).reshape((3, 3), order="F")
        _, rvecs, tvecs, _ = cv2.solvePnPRansac(
            points, pixels, camera_matrix, None, iterationsCount=100_000
        )
        T = self.T_from_rvec_tvec(rvecs, tvecs)
        T_ref = self.t_from_xyzwpr(w=180.0)
        T1 = np.linalg.inv(T_ref) @ T
        T2 = T_ref @ T
        return T2

    def T_from_rvec_tvec(self, rvec, tvec):
        T = np.eye(4, 4)
        R = np.zeros((3, 3))
        assert rvec.shape == (3, 3) or rvec.shape == (
            3,
            1,
        ), f"Illegal rvec shape {rvec}"
        if rvec.shape == (3, 3):
            R = rvec
        else:
            R, _ = cv2.Rodrigues(rvec)
        T[:3, :3] = R
        assert tvec.flatten().shape == (3,), f"Illegal tvec shape {tvec}"
        T[:3, 3] = tvec.flatten()
        return T

    def t_from_xyzwpr(self, x=0.0, y=0.0, z=0.0, w=0.0, p=0.0, r=0.0):
        t = np.eye(4, 4)
        t[:3, :3] = Rotation.from_euler("xyz", [w, p, r], degrees=True).as_matrix()
        t[:3, 3] = [x, y, z]
        return t

    def xyzwpr_from_t(self, t):
        [x, y, z] = t[:3, 3]
        [w, p, r] = Rotation.from_matrix(t[:3, :3]).as_euler("xyz", degrees=True)
        return x, y, z, w, p, r
