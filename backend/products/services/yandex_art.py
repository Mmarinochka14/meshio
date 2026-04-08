import base64
import time
from io import BytesIO

import requests
from PIL import Image, ImageOps
from django.conf import settings

YANDEX_ART_CREATE_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/imageGenerationAsync"
YANDEX_ART_OPERATION_URL = "https://operation.api.cloud.yandex.net/operations"


def normalize_user_prompt(user_prompt: str) -> str:
    value = user_prompt.strip().lower()

    simple_presets = {
        "розовый": "pink smooth matte plastic, single continuous uninterrupted surface",
        "красный": "red smooth matte plastic, single continuous uninterrupted surface",
        "синий": "blue smooth matte plastic, single continuous uninterrupted surface",
        "фиолетовый": "purple smooth matte plastic, single continuous uninterrupted surface",
        "черный": "black smooth matte rubber, single continuous uninterrupted surface",
        "белый": "white smooth ceramic, single continuous uninterrupted surface",
        "серый": "gray brushed metal, subtle fine surface detail",
        "зеленый": "green painted metal, subtle fine surface detail",
        "дерево": "natural wood surface with soft fine grain, no planks, no seams",
        "металл": "brushed metal surface with subtle fine detail, no seams",
        "пластик": "smooth matte plastic, single continuous uninterrupted surface",
        "ткань": "soft woven fabric surface with subtle uniform weave",
    }

    return simple_presets.get(value, user_prompt)


def build_texture_prompt(user_prompt: str) -> str:
    normalized_prompt = normalize_user_prompt(user_prompt)

    return (
        "flat 2D material texture only, full frame coverage, edge-to-edge surface, "
        "single continuous smooth surface, uniform material, uninterrupted surface, "
        "no seams, no cuts, no grooves, no cracks, no tiles, no blocks, no bricks, "
        "no paneling, no segment lines, no decorative pattern, no repeating hard shapes, "
        "no object, no sphere, no ball, no preview render, no mockup, no flowers, "
        "no scene, no background setup, no studio shot, no shadows, no highlights, "
        "no perspective, no depth, no 3D object, no centered object, "
        "realistic material surface only, soft matte finish, clean surface behavior, "
        f"material description: {normalized_prompt}"
    )


def crop_texture_center(image_bytes: bytes, zoom: float = 3, output_size: int = 1024) -> bytes:
    image = Image.open(BytesIO(image_bytes)).convert("RGB")

    width, height = image.size
    crop_width = int(width / zoom)
    crop_height = int(height / zoom)

    left = (width - crop_width) // 2
    top = (height - crop_height) // 2
    right = left + crop_width
    bottom = top + crop_height

    cropped = image.crop((left, top, right, bottom))
    result = ImageOps.fit(
        cropped,
        (output_size, output_size),
        method=Image.LANCZOS,
        centering=(0.5, 0.5),
    )

    output = BytesIO()
    result.save(output, format="PNG")
    return output.getvalue()


def generate_texture_image(prompt: str) -> bytes:
    api_key = settings.YANDEX_API_KEY
    folder_id = settings.YANDEX_FOLDER_ID

    if not api_key or not folder_id:
        raise ValueError("Yandex API key or folder ID is not configured.")

    final_prompt = build_texture_prompt(prompt)

    headers = {
        "Authorization": f"Api-Key {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "modelUri": f"art://{folder_id}/yandex-art/latest",
        "generationOptions": {
            "seed": int(time.time()),
            "aspectRatio": {
                "widthRatio": "1",
                "heightRatio": "1",
            },
        },
        "messages": [
            {
                "text": final_prompt,
            }
        ],
    }

    response = requests.post(
        YANDEX_ART_CREATE_URL,
        headers=headers,
        json=payload,
        timeout=60,
    )

    if not response.ok:
        raise RuntimeError(
            f"YandexART create failed: {response.status_code} {response.text}"
        )

    operation_id = response.json()["id"]

    for _ in range(30):
        op_response = requests.get(
            f"{YANDEX_ART_OPERATION_URL}/{operation_id}",
            headers=headers,
            timeout=30,
        )

        if not op_response.ok:
            raise RuntimeError(
                f"YandexART operation failed: {op_response.status_code} {op_response.text}"
            )

        op_data = op_response.json()

        if op_data.get("done"):
            if "error" in op_data:
                raise RuntimeError(str(op_data["error"]))

            image_base64 = op_data["response"]["image"]
            original_image = base64.b64decode(image_base64)

            processed_image = crop_texture_center(
                original_image,
                zoom=1.5,
                output_size=1024,
            )
            return processed_image

        time.sleep(2)

    raise TimeoutError("YandexART generation timed out.")