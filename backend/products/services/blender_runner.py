import subprocess
from pathlib import Path


BLENDER_EXECUTABLE = r"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe"


def run_blender_preprocessing(
    *,
    source_path: Path,
    output_glb_path: Path,
    output_uv_png_path: Path | None = None,
    blender_script_path: Path | None = None,
) -> dict:
    if not source_path.exists():
        raise RuntimeError(f"Source file not found: {source_path}")

    if blender_script_path is None:
        blender_script_path = (
            Path(__file__).resolve().parent.parent / "blender_scripts" / "prepare_viewer.py"
        )

    if not blender_script_path.exists():
        raise RuntimeError(f"Blender script not found: {blender_script_path}")

    output_glb_path.parent.mkdir(parents=True, exist_ok=True)
    if output_uv_png_path is not None:
        output_uv_png_path.parent.mkdir(parents=True, exist_ok=True)

    command = [
        BLENDER_EXECUTABLE,
        "--background",
        "--python",
        str(blender_script_path),
        "--",
        str(source_path),
        str(output_glb_path),
    ]

    if output_uv_png_path is not None:
        command.append(str(output_uv_png_path))

    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=False,
    )

    if result.returncode != 0:
        raise RuntimeError(
            "Blender preprocessing failed.\n"
            f"STDOUT:\n{result.stdout}\n\n"
            f"STDERR:\n{result.stderr}"
        )

    if not output_glb_path.exists():
        raise RuntimeError(
            "Blender finished, but viewer GLB was not created.\n"
            f"STDOUT:\n{result.stdout}\n\n"
            f"STDERR:\n{result.stderr}"
        )
    uv_exists = output_uv_png_path is not None and output_uv_png_path.exists()

    return {
        "viewer_glb_path": output_glb_path,
        "uv_preview_path": output_uv_png_path if uv_exists else None,
        "stdout": result.stdout,
        "stderr": result.stderr,
    }