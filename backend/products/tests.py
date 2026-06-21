import base64
from io import BytesIO
from unittest.mock import Mock, patch

from django.test import SimpleTestCase, override_settings
from PIL import Image

from products.services.yandex_art import (
    build_texture_prompt,
    create_procedural_texture,
    generate_texture_image,
)


def make_png_base64():
    output = BytesIO()
    Image.new("RGB", (16, 16), (120, 80, 160)).save(output, format="PNG")
    return base64.b64encode(output.getvalue()).decode("ascii")


class TextureGenerationRoutingTests(SimpleTestCase):
    def test_yandex_prompt_describes_only_a_flat_pattern(self):
        prompt = build_texture_prompt("цветочные обои")

        self.assertIn("бесшовный двумерный паттерн", prompt)
        self.assertIn("цветочные обои", prompt)
        self.assertNotIn("sphere", prompt.lower())
        self.assertNotIn("ball", prompt.lower())
        self.assertNotIn("3d render", prompt.lower())

    def test_known_simple_material_is_generated_locally(self):
        image_bytes = create_procedural_texture("светлое дерево")

        self.assertIsNotNone(image_bytes)
        self.assertEqual(Image.open(BytesIO(image_bytes)).size, (1024, 1024))

    def test_flower_wallpaper_is_not_replaced_with_generic_local_texture(self):
        self.assertIsNone(create_procedural_texture("цветочные обои"))

    def test_unusual_prompt_is_not_generated_locally(self):
        self.assertIsNone(
            create_procedural_texture("перламутровая мозаика с золотыми прожилками")
        )

    @override_settings(YANDEX_API_KEY="test-key", YANDEX_FOLDER_ID="test-folder")
    @patch("products.services.yandex_art.time.sleep")
    @patch("products.services.yandex_art.requests.get")
    @patch("products.services.yandex_art.requests.post")
    def test_complex_prompt_is_sent_to_yandex_art(self, post, get, _sleep):
        post.return_value = Mock(
            ok=True,
            json=Mock(return_value={"id": "operation-1"}),
        )
        get.return_value = Mock(
            ok=True,
            json=Mock(
                return_value={
                    "done": True,
                    "response": {"image": make_png_base64()},
                }
            ),
        )

        image_bytes = generate_texture_image("цветочные обои")

        self.assertTrue(post.called)
        payload = post.call_args.kwargs["json"]
        self.assertEqual(payload["modelUri"], "art://test-folder/yandex-art/latest")
        self.assertIn("цветочные обои", payload["messages"][0]["text"])
        self.assertEqual(Image.open(BytesIO(image_bytes)).size, (1024, 1024))

# Create your tests here.
