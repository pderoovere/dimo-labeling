class DimoMerger:

    def __init__(self) -> None:
        self.scene_idx = None

    def merge(self, datasets, merge_scenes=True):
        result = {}
        result['models'] = datasets[0]['models']
        for dataset in datasets:
            for camera in dataset.keys():
                if camera is not 'models':
                    self.merge_camera(result, dataset, camera, merge_scenes)

    def merge_camera(self, result, new_ds, camera, merge_scenes):
        if camera not in result:
            result[camera] = new_ds[camera]
        else:
            self.scene_idx = result[camera][-1]['id'] + 1
            for scene in new_ds[camera]:
                self.merge_scene(result[camera], scene, merge_scenes)

    def merge_scene(self, scenes, new_scene, merge_scenes):
        for scene in scenes:
            if scene['id'] == new_scene['id']:
                if merge_scenes:
                    self.merge_images(scene, new_scene)
                    return  
                else:
                    scene['id'] = self.scene_idx
                    self.scene_idx += 1
                    break
        scenes.append(new_scene)

    def merge_images(self, scene, new_scene):
        last_image_id = scene['images'][-1]['id']
        for image in new_scene['images']:
            image['id'] = last_image_id + image['id']
            scene['images'].append(image)
            print(f"Increased id to {image['id']}")


from pathlib import Path
from dimo_loader import DimoLoader
from dimo_writer import DimoWriter

orig_path = Path('/Users/peterderoovere/Documents/Baekeland/Data.nosync/sample_paper')
loader = DimoLoader()
ds = loader.load(orig_path)
ds2 = loader.load(orig_path)

merger = DimoMerger()
merged = merger.merge([ds, ds2], False)

new_path = Path('/Users/peterderoovere/Documents/Baekeland/Data.nosync/sample_paper_2')
writer = DimoWriter()
writer.save(ds, orig_path, new_path)