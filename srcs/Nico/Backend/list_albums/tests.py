from django.test import TestCase

from list_albums.views import expand_cart_items


class CartQuantityTests(TestCase):
    def test_expand_cart_items_repeats_quantity_for_each_image(self):
        items = [
            {"path": "/media/date/01_01_2026/img-1.jpg", "quantity": 2},
            "/media/date/01_01_2026/img-2.jpg",
            {"path": "/media/date/01_01_2026/img-3.jpg", "quantity": 3},
        ]

        self.assertEqual(
            expand_cart_items(items),
            [
                "/media/date/01_01_2026/img-1.jpg",
                "/media/date/01_01_2026/img-1.jpg",
                "/media/date/01_01_2026/img-2.jpg",
                "/media/date/01_01_2026/img-3.jpg",
                "/media/date/01_01_2026/img-3.jpg",
                "/media/date/01_01_2026/img-3.jpg",
            ],
        )
