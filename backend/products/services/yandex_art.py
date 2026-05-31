import base64
import random
import time
from io import BytesIO

import requests
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from django.conf import settings

YANDEX_ART_CREATE_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/imageGenerationAsync"
YANDEX_ART_OPERATION_URL = "https://operation.api.cloud.yandex.net/operations"


def encode_png(image: Image.Image) -> bytes:
    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def normalize_user_prompt(user_prompt: str) -> str:
    value = user_prompt.strip().lower()

    readable_presets = {
        "розовый": "flat pink smooth matte plastic color field, subtle fine noise only",
        "розовый матовый пластик": "flat pink smooth matte plastic color field, subtle fine noise only",
        "красный": "flat red smooth matte plastic color field, subtle fine noise only",
        "синий": "flat blue smooth matte plastic color field, subtle fine noise only",
        "фиолетовый": "flat purple smooth matte plastic color field, subtle fine noise only",
        "фиолетовый глянцевый пластик": "flat purple glossy plastic surface, subtle fine noise only",
        "черный": "flat black matte rubber surface, subtle fine grain only",
        "чёрный": "flat black matte rubber surface, subtle fine grain only",
        "черная матовая резина": "flat black matte rubber surface, subtle fine grain only",
        "чёрная матовая резина": "flat black matte rubber surface, subtle fine grain only",
        "белый": "flat white ceramic surface, subtle fine speckle only",
        "белая керамика": "flat white ceramic surface, subtle fine speckle only",
        "серый": "flat gray brushed metal surface, very fine horizontal micro scratches",
        "серый шлифованный металл": "flat gray brushed metal surface, very fine horizontal micro scratches",
        "зеленый": "flat solid green painted metal surface, subtle micro scratches, no rust, no panels",
        "зелёный": "flat solid green painted metal surface, subtle micro scratches, no rust, no panels",
        "зеленый окрашенный металл": "flat solid green painted metal surface, subtle micro scratches, no rust, no panels",
        "зелёный окрашенный металл": "flat solid green painted metal surface, subtle micro scratches, no rust, no panels",
        "дерево": "flat natural wood surface with soft fine grain, no planks, no seams",
        "натуральное дерево": "flat natural wood surface with soft fine grain, no planks, no seams",
        "металл": "flat brushed metal surface with subtle fine detail, no seams",
        "пластик": "flat smooth matte plastic color field, subtle fine noise only",
        "ткань": "flat soft woven fabric surface with subtle uniform weave",
    }

    if value in readable_presets:
        return readable_presets[value]

    simple_presets = {
        "розовый": "flat pink smooth matte plastic color field, subtle fine noise only",
        "розовый матовый пластик": "flat pink smooth matte plastic color field, subtle fine noise only",
        "красный": "flat red smooth matte plastic color field, subtle fine noise only",
        "синий": "flat blue smooth matte plastic color field, subtle fine noise only",
        "фиолетовый": "flat purple smooth matte plastic color field, subtle fine noise only",
        "фиолетовый глянцевый пластик": "flat purple glossy plastic surface, subtle fine noise only",
        "черный": "flat black matte rubber surface, subtle fine grain only",
        "чёрный": "flat black matte rubber surface, subtle fine grain only",
        "черная матовая резина": "flat black matte rubber surface, subtle fine grain only",
        "чёрная матовая резина": "flat black matte rubber surface, subtle fine grain only",
        "белый": "flat white ceramic surface, subtle fine speckle only",
        "белая керамика": "flat white ceramic surface, subtle fine speckle only",
        "серый": "flat gray brushed metal surface, very fine horizontal micro scratches",
        "серый шлифованный металл": "flat gray brushed metal surface, very fine horizontal micro scratches",
        "зеленый": "flat solid green painted metal surface, subtle micro scratches, no rust, no panels",
        "зелёный": "flat solid green painted metal surface, subtle micro scratches, no rust, no panels",
        "зеленый окрашенный металл": "flat solid green painted metal surface, subtle micro scratches, no rust, no panels",
        "зелёный окрашенный металл": "flat solid green painted metal surface, subtle micro scratches, no rust, no panels",
        "дерево": "flat natural wood surface with soft fine grain, no planks, no seams",
        "натуральное дерево": "flat natural wood surface with soft fine grain, no planks, no seams",
        "металл": "flat brushed metal surface with subtle fine detail, no seams",
        "пластик": "flat smooth matte plastic color field, subtle fine noise only",
        "ткань": "flat soft woven fabric surface with subtle uniform weave",
    }

    return simple_presets.get(value, user_prompt)


def build_texture_prompt(user_prompt: str) -> str:
    normalized_prompt = normalize_user_prompt(user_prompt)

    return (
        "Create a raw flat square seamless texture image, not a preview render. "
        "The image must be a 2D surface photographed straight from above and fill every pixel edge to edge. "
        "No object, no sphere, no material ball, no 3D render, no product photo, no studio background, "
        "no perspective, no shadows, no highlights, no centered subject, no gray backdrop, no border, "
        "no text, no logo, no watermark. Absolutely forbidden: a round ball or sample sphere. "
        "It must look like a plain texture file that can be wrapped directly on a 3D mesh. "
        "ВАЖНО: не рисуй шар, сферу, образец материала, предмет или фон; нужна плоская бесшовная картинка-поверхность. "
        f"Texture surface: {normalized_prompt}"
    )


def pick_texture_palette(value: str):
    readable_color_rules = [
        (("розов", "pink"), ((211, 105, 165), (246, 176, 214))),
        (("фиолет", "purple"), ((94, 64, 168), (157, 112, 238))),
        (("красн", "red"), ((144, 40, 48), (222, 83, 83))),
        (("син", "blue"), ((43, 78, 158), (92, 139, 228))),
        (("голуб", "cyan"), ((64, 148, 180), (143, 217, 232))),
        (("зелен", "зелён", "green"), ((28, 126, 106), (62, 158, 135))),
        (("желт", "жёлт", "yellow"), ((184, 142, 38), (235, 202, 95))),
        (("оранж", "orange"), ((190, 91, 31), (245, 153, 62))),
        (("черн", "чёрн", "black"), ((22, 22, 25), (58, 58, 64))),
        (("бел", "white"), ((210, 210, 205), (250, 248, 240))),
        (("сер", "gray", "grey"), ((92, 96, 104), (166, 170, 178))),
        (("корич", "дерев", "wood", "brown"), ((102, 63, 34), (190, 128, 72))),
    ]

    for keywords, palette in readable_color_rules:
        if any(keyword in value for keyword in keywords):
            return palette

    color_rules = [
        (("розов", "pink"), ((211, 105, 165), (246, 176, 214))),
        (("фиолет", "purple"), ((94, 64, 168), (157, 112, 238))),
        (("красн", "red"), ((144, 40, 48), (222, 83, 83))),
        (("син", "blue"), ((43, 78, 158), (92, 139, 228))),
        (("голуб", "cyan"), ((64, 148, 180), (143, 217, 232))),
        (("зелен", "зелён", "green"), ((28, 126, 106), (62, 158, 135))),
        (("желт", "yellow"), ((184, 142, 38), (235, 202, 95))),
        (("оранж", "orange"), ((190, 91, 31), (245, 153, 62))),
        (("черн", "чёрн", "black"), ((22, 22, 25), (58, 58, 64))),
        (("бел", "white"), ((210, 210, 205), (250, 248, 240))),
        (("сер", "gray", "grey"), ((92, 96, 104), (166, 170, 178))),
        (("корич", "brown"), ((92, 58, 36), (151, 101, 66))),
    ]

    for keywords, palette in color_rules:
        if any(keyword in value for keyword in keywords):
            return palette

    return (86, 92, 116), (158, 148, 188)


def classify_texture_material(value: str) -> str:
    if any(word in value for word in ("дерев", "wood")):
        return "wood"
    if any(word in value for word in ("металл", "metal", "сталь", "желез")):
        return "metal"
    if any(word in value for word in ("ткан", "fabric", "кож", "leather")):
        return "fabric"
    if any(word in value for word in ("кам", "stone", "бетон", "concrete")):
        return "stone"
    if any(word in value for word in ("керами", "ceramic", "фарфор")):
        return "ceramic"
    if any(word in value for word in ("резин", "rubber")):
        return "rubber"
    return "plastic"


def blend_colors(first, second, factor: float):
    return tuple(int(first[i] * (1 - factor) + second[i] * factor) for i in range(3))


def create_procedural_texture(user_prompt: str, output_size: int = 1024) -> bytes | None:
    value = user_prompt.strip().lower()

    if not value:
        return None

    dark, light = pick_texture_palette(value)
    material = classify_texture_material(value)
    base = blend_colors(dark, light, 0.35)
    rng = random.Random(value)

    image = Image.new("RGB", (output_size, output_size), base)
    noise_strength = 10 if material in ("plastic", "ceramic") else 22
    noise = Image.effect_noise((output_size, output_size), noise_strength).convert("L")
    grain = ImageOps.colorize(noise, black=dark, white=light)
    image = Image.blend(image, grain, 0.18)
    draw = ImageDraw.Draw(image, "RGBA")

    pixels = image.load()

    if material == "metal":
        for _ in range(260):
            y = rng.randrange(output_size)
            x = rng.randrange(output_size)
            length = rng.randrange(35, 260)
            color = blend_colors(dark, light, rng.random())

            for dx in range(length):
                xx = (x + dx) % output_size
                current = pixels[xx, y]
                pixels[xx, y] = tuple(int(current[i] * 0.68 + color[i] * 0.32) for i in range(3))

    elif material == "wood":
        for y in range(output_size):
            wave = int(18 * rng.random() + 14 * (y / output_size))
            factor = 0.35 + 0.28 * ((y + wave) % 54) / 54
            color = blend_colors(dark, light, factor)
            draw.line([(0, y), (output_size, y)], fill=(*color, 88), width=1)

        for _ in range(34):
            y = rng.randrange(output_size)
            color = blend_colors(dark, light, rng.uniform(0.15, 0.45))
            x0 = rng.randrange(-120, output_size)
            x1 = rng.randrange(120, output_size + 240)
            if x1 < x0:
                x0, x1 = x1, x0
            draw.arc(
                [x0, y - 80, x1, y + 80],
                start=0,
                end=180,
                fill=(*color, 48),
                width=rng.randrange(2, 5),
            )

    elif material == "fabric":
        step = 18
        for pos in range(0, output_size, step):
            color_a = blend_colors(dark, light, 0.42)
            color_b = blend_colors(dark, light, 0.58)
            draw.line([(0, pos), (output_size, pos)], fill=(*color_a, 80), width=2)
            draw.line([(pos, 0), (pos, output_size)], fill=(*color_b, 72), width=2)

    elif material == "stone":
        for _ in range(120):
            x = rng.randrange(output_size)
            y = rng.randrange(output_size)
            radius = rng.randrange(8, 54)
            color = blend_colors(dark, light, rng.random())
            draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill=(*color, rng.randrange(10, 32)))

        image = image.filter(ImageFilter.GaussianBlur(radius=0.9))

    elif material == "rubber":
        for _ in range(1800):
            x = rng.randrange(output_size)
            y = rng.randrange(output_size)
            color = blend_colors(dark, light, rng.random())
            draw.point((x, y), fill=(*color, 130))

    else:
        for _ in range(420):
            x = rng.randrange(output_size)
            y = rng.randrange(output_size)
            radius = rng.randrange(1, 5)
            color = blend_colors(dark, light, rng.random())
            draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill=(*color, 42))

    return encode_png(image)


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
    procedural_texture = create_procedural_texture(prompt)
    if procedural_texture:
        return procedural_texture

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
                zoom=1.0,
                output_size=1024,
            )
            return processed_image

        time.sleep(2)

    raise TimeoutError("YandexART generation timed out.")
