import bpy
import sys
from pathlib import Path
from mathutils import Vector


def parse_args():
    argv = sys.argv
    if "--" not in argv:
        raise RuntimeError("Не переданы аргументы после --")

    argv = argv[argv.index("--") + 1 :]

    if len(argv) < 2:
        raise RuntimeError(
            "Нужно передать: <input_path> <output_glb_path> [output_uv_png_path] [output_preview_png_path]"
        )

    input_path = Path(argv[0]).resolve()
    output_glb_path = Path(argv[1]).resolve()
    output_uv_png_path = Path(argv[2]).resolve() if len(argv) > 2 else None
    output_preview_png_path = Path(argv[3]).resolve() if len(argv) > 3 else None

    return input_path, output_glb_path, output_uv_png_path, output_preview_png_path


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)

    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)

    for block in bpy.data.images:
        if block.users == 0:
            bpy.data.images.remove(block)

    for block in bpy.data.cameras:
        if block.users == 0:
            bpy.data.cameras.remove(block)

    for block in bpy.data.lights:
        if block.users == 0:
            bpy.data.lights.remove(block)


def import_model(input_path: Path):
    suffix = input_path.suffix.lower()

    if suffix == ".fbx":
        bpy.ops.import_scene.fbx(filepath=str(input_path))
    elif suffix == ".obj":
        bpy.ops.wm.obj_import(filepath=str(input_path))
    elif suffix in {".glb", ".gltf"}:
        bpy.ops.import_scene.gltf(filepath=str(input_path))
    elif suffix == ".blend":
        raise RuntimeError("Автообработка .blend пока не реализована")
    else:
        raise RuntimeError(f"Неподдерживаемый формат: {suffix}")


def get_imported_root_objects():
    objs = [obj for obj in bpy.context.scene.objects if obj.type in {"MESH", "ARMATURE", "EMPTY"}]
    if not objs:
        raise RuntimeError("После импорта не найдено объектов сцены")
    return objs


def get_mesh_objects():
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError("После импорта не найдено mesh-объектов")
    return meshes


def select_objects(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]


def apply_transforms(objects):
    select_objects(objects)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)


def compute_world_bbox(mesh_objects):
    min_corner = Vector((float("inf"), float("inf"), float("inf")))
    max_corner = Vector((float("-inf"), float("-inf"), float("-inf")))

    for obj in mesh_objects:
        for corner in obj.bound_box:
            world_corner = obj.matrix_world @ Vector(corner)
            min_corner.x = min(min_corner.x, world_corner.x)
            min_corner.y = min(min_corner.y, world_corner.y)
            min_corner.z = min(min_corner.z, world_corner.z)

            max_corner.x = max(max_corner.x, world_corner.x)
            max_corner.y = max(max_corner.y, world_corner.y)
            max_corner.z = max(max_corner.z, world_corner.z)

    return min_corner, max_corner


def center_and_scale(objects, target_size=1.4):
    mesh_objects = [obj for obj in objects if obj.type == "MESH"]
    if not mesh_objects:
        return

    bpy.context.view_layer.update()

    min_corner, max_corner = compute_world_bbox(mesh_objects)
    center = (min_corner + max_corner) / 2
    size = max_corner - min_corner
    max_axis = max(size.x, size.y, size.z)

    if max_axis <= 0:
        return

    for obj in objects:
        obj.location -= center

    bpy.context.view_layer.update()

    mesh_objects = [obj for obj in objects if obj.type == "MESH"]
    min_corner, max_corner = compute_world_bbox(mesh_objects)
    size = max_corner - min_corner
    max_axis = max(size.x, size.y, size.z)

    if max_axis <= 0:
        return

    scale_factor = target_size / max_axis

    for obj in objects:
        obj.scale = obj.scale * scale_factor

    bpy.context.view_layer.update()

    select_objects(objects)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    bpy.context.view_layer.update()

    mesh_objects = [obj for obj in objects if obj.type == "MESH"]
    min_corner, max_corner = compute_world_bbox(mesh_objects)
    floor_offset = min_corner.z

    for obj in objects:
        obj.location.z -= floor_offset

    bpy.context.view_layer.update()


def ensure_materials(mesh_objects):
    for obj in mesh_objects:
        if not obj.data.materials:
            mat = bpy.data.materials.new(name=f"{obj.name}_Material")
            mat.use_nodes = True
            obj.data.materials.append(mat)

def make_meshes_double_sided(mesh_objects):
    for obj in mesh_objects:
        for mat in obj.data.materials:
            if mat is None:
                continue
            if not mat.use_nodes:
                mat.use_nodes = True
            mat.use_backface_culling = False

def ensure_preview_materials(mesh_objects):
    for obj in mesh_objects:
        if not obj.data.materials:
            mat = bpy.data.materials.new(name=f"{obj.name}_PreviewMaterial")
            mat.use_nodes = True

            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Base Color"].default_value = (0.68, 0.68, 0.72, 1.0)
                bsdf.inputs["Roughness"].default_value = 0.75
                bsdf.inputs["Metallic"].default_value = 0.0
                bsdf.inputs["Specular IOR Level"].default_value = 0.25

            obj.data.materials.append(mat)
            continue

        for mat in obj.data.materials:
            if mat is None:
                continue

            if not mat.use_nodes:
                mat.use_nodes = True

            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                base = bsdf.inputs["Base Color"].default_value
                r, g, b, a = base

                # только совсем почти чёрные материалы поднимаем
                if r < 0.05 and g < 0.05 and b < 0.05:
                    bsdf.inputs["Base Color"].default_value = (0.62, 0.62, 0.66, 1.0)
                    bsdf.inputs["Roughness"].default_value = 0.8
                    bsdf.inputs["Metallic"].default_value = 0.0
                    bsdf.inputs["Specular IOR Level"].default_value = 0.2

def export_glb(output_glb_path: Path):
    output_glb_path.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.export_scene.gltf(
        filepath=str(output_glb_path),
        export_format='GLB',
        use_selection=False,
        export_texcoords=True,
        export_normals=True,
        export_tangents=True,
        export_materials='EXPORT',
        export_animations=True,
        export_cameras=False,
        export_lights=False,
    )


def export_uv_layout(output_uv_png_path: Path):
    if output_uv_png_path is None:
        return

    mesh_objects = get_mesh_objects()
    first_mesh = mesh_objects[0]

    if not first_mesh.data.uv_layers:
        return

    output_uv_png_path.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = first_mesh
    first_mesh.select_set(True)

    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")

    window = bpy.context.window
    screen = window.screen
    area = next((a for a in screen.areas if a.type == "IMAGE_EDITOR"), None)

    created_temp_area = False
    if area is None:
        area = screen.areas[0]
        old_type = area.type
        area.type = "IMAGE_EDITOR"
        created_temp_area = True
    else:
        old_type = area.type

    region = next(r for r in area.regions if r.type == "WINDOW")

    with bpy.context.temp_override(window=window, area=area, region=region):
        bpy.ops.uv.export_layout(
            filepath=str(output_uv_png_path),
            size=(2048, 2048),
            opacity=1.0,
            export_all=False,
            modified=False,
            mode='PNG',
        )

    bpy.ops.object.mode_set(mode="OBJECT")

    if created_temp_area:
        area.type = old_type

def setup_preview_scene(mesh_objects):
    scene = bpy.context.scene

    scene.render.engine = "CYCLES"
    scene.cycles.samples = 48
    scene.cycles.use_denoising = True

    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = True

    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1600
    scene.render.resolution_percentage = 100

    for obj in mesh_objects:
        obj.hide_render = False

    ensure_preview_materials(mesh_objects)
    make_meshes_double_sided(mesh_objects)

    for obj in list(bpy.context.scene.objects):
        if obj.type in {"CAMERA", "LIGHT"}:
            bpy.data.objects.remove(obj, do_unlink=True)

    bpy.context.view_layer.update()

    min_corner, max_corner = compute_world_bbox(mesh_objects)
    center = (min_corner + max_corner) / 2
    size = max_corner - min_corner
    max_axis = max(size.x, size.y, size.z)

    if max_axis <= 0:
        max_axis = 1.0

    cam_data = bpy.data.cameras.new("PreviewCamera")
    cam_data.type = "ORTHO"
    cam_data.clip_start = 0.01
    cam_data.clip_end = 1000
    cam_data.ortho_scale = max_axis * 1.45

    cam = bpy.data.objects.new("PreviewCamera", cam_data)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam

    # ближе и почти фронтально
    cam.location = (
        center.x,
        center.y - max_axis * 3.0,
        center.z + max_axis * 0.35,
    )

    direction = center - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    # мягкий верхний свет
    sun_data = bpy.data.lights.new(name="PreviewSun", type="SUN")
    sun_data.energy = 1.2
    sun = bpy.data.objects.new(name="PreviewSun", object_data=sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (0.95, 0.0, 0.15)

    # мягкий фронтальный свет
    fill_data = bpy.data.lights.new(name="PreviewArea", type="AREA")
    fill_data.energy = 850
    fill_data.shape = "RECTANGLE"
    fill_data.size = max_axis * 3.0
    fill_data.size_y = max_axis * 3.0

    fill = bpy.data.objects.new(name="PreviewArea", object_data=fill_data)
    bpy.context.collection.objects.link(fill)
    fill.location = (
        center.x,
        center.y - max_axis * 2.0,
        center.z + max_axis * 1.0,
    )
    fill.rotation_euler = (1.2, 0.0, 0.0)

    # очень слабый контровой
    rim_data = bpy.data.lights.new(name="PreviewRim", type="AREA")
    rim_data.energy = 180
    rim_data.shape = "RECTANGLE"
    rim_data.size = max_axis * 2.2
    rim_data.size_y = max_axis * 2.2

    rim = bpy.data.objects.new(name="PreviewRim", object_data=rim_data)
    bpy.context.collection.objects.link(rim)
    rim.location = (
        center.x + max_axis * 1.0,
        center.y + max_axis * 1.2,
        center.z + max_axis * 0.9,
    )
    rim.rotation_euler = (2.2, 0.0, 2.8)

    bpy.context.view_layer.update()

def export_preview_png(output_preview_png_path: Path):
    if output_preview_png_path is None:
        return

    mesh_objects = get_mesh_objects()
    output_preview_png_path.parent.mkdir(parents=True, exist_ok=True)

    setup_preview_scene(mesh_objects)

    bpy.context.scene.render.filepath = str(output_preview_png_path)
    bpy.ops.render.render(write_still=True)

    if not output_preview_png_path.exists():
        raise RuntimeError(f"Preview PNG was not created: {output_preview_png_path}")


def main():
    input_path, output_glb_path, output_uv_png_path, output_preview_png_path = parse_args()

    if not input_path.exists():
        raise RuntimeError(f"Входной файл не найден: {input_path}")

    clear_scene()
    import_model(input_path)

    imported_objects = get_imported_root_objects()
    mesh_objects = get_mesh_objects()

    apply_transforms(imported_objects)
    center_and_scale(imported_objects, target_size=1.4)
    ensure_materials(mesh_objects)

    export_glb(output_glb_path)
    export_preview_png(output_preview_png_path)

    if output_uv_png_path is not None:
        try:
            export_uv_layout(output_uv_png_path)
        except Exception as e:
            print(f"UV export skipped: {e}")


if __name__ == "__main__":
    main()