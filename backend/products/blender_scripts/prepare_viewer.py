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
        raise RuntimeError("Нужно передать: <input_path> <output_glb_path> [output_uv_png_path]")

    input_path = Path(argv[0]).resolve()
    output_glb_path = Path(argv[1]).resolve()
    output_uv_png_path = Path(argv[2]).resolve() if len(argv) > 2 else None

    return input_path, output_glb_path, output_uv_png_path


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

    # центрируем
    for obj in objects:
        obj.location -= center

    bpy.context.view_layer.update()

    # пересчитываем bbox после центрирования
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

    # применяем scale
    select_objects(objects)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    bpy.context.view_layer.update()

    # ставим модель на "пол"
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

    # Нужен временный IMAGE_EDITOR area; проще сделать через override окна
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


def main():
    input_path, output_glb_path, output_uv_png_path = parse_args()

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
    export_uv_layout(output_uv_png_path)


if __name__ == "__main__":
    main()