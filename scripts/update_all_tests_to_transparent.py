#!/usr/bin/env python3
"""
Updates all DatabaseAndMedia test suites to assert transparent .webp
format instead of _light.webp / _dark.webp.
"""

import os
import glob
import re

TEST_DIR = 'site/src/__tests__'

def update_test_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    orig = content

    # 1. Standard replacements
    content = content.replace("expect(p.primary_image.endsWith('_light.webp')).toBe(true);", 
                              "expect(p.primary_image.endsWith('.webp')).toBe(true);\n      expect(p.primary_image.includes('_light.webp')).toBe(false);")
    content = content.replace("expect(p.dark_image.endsWith('_dark.webp')).toBe(true);", 
                              "expect(p.dark_image.endsWith('.webp')).toBe(true);\n      expect(p.dark_image.includes('_dark.webp')).toBe(false);")
    content = content.replace("expect(m.url.endsWith('_light.webp')).toBe(true);", 
                              "expect(m.url.endsWith('.webp')).toBe(true);\n      expect(m.url.includes('_light.webp')).toBe(false);")
    content = content.replace("expect(m.dark_url.endsWith('_dark.webp')).toBe(true);", 
                              "expect(m.dark_url.endsWith('.webp')).toBe(true);\n      expect(m.dark_url.includes('_dark.webp')).toBe(false);")

    # For prod.primary_image in reordered / detail tests
    content = content.replace("expect(prod.primary_image.endsWith('_light.webp')).toBe(true);",
                              "expect(prod.primary_image.endsWith('.webp')).toBe(true);\n      expect(prod.primary_image.includes('_light.webp')).toBe(false);")
    content = content.replace("expect(prod.dark_image.endsWith('_dark.webp')).toBe(true);",
                              "expect(prod.dark_image.endsWith('.webp')).toBe(true);\n      expect(prod.dark_image.includes('_dark.webp')).toBe(false);")

    # Specific sub-patterns
    # Lotus Meat Grinder LT01001
    content = content.replace("expect(prod.primary_image).toContain('Ətçəkən Lotus LT01001_light.webp');",
                              "expect(prod.primary_image).toContain('Ətçəkən Lotus LT01001.webp');")
    content = content.replace("expect(prod.dark_image).toContain('Ətçəkən Lotus LT01001_dark.webp');",
                              "expect(prod.dark_image).toContain('Ətçəkən Lotus LT01001.webp');")
    content = content.replace("expect(media[0].url).toContain('Ətçəkən Lotus LT01001_light.webp');",
                              "expect(media[0].url).toContain('Ətçəkən Lotus LT01001.webp');")
    content = content.replace("expect(media[1].url).toContain('Ətçəkən Lotus LT01001 (2)_light.webp');",
                              "expect(media[1].url).toContain('Ətçəkən Lotus LT01001 (2).webp');")
    content = content.replace("expect(media[2].url).toContain('Ətçəkən Lotus LT01001 (3)_light.webp');",
                              "expect(media[2].url).toContain('Ətçəkən Lotus LT01001 (3).webp');")

    # Artel AC reordered test
    content = content.replace("expect(prod.primary_image.includes(' (2)_light.webp')).toBe(false);",
                              "expect(prod.primary_image.includes(' (2).webp')).toBe(false);")
    content = content.replace("expect(prod.primary_image.includes(' (3)_light.webp')).toBe(false);",
                              "expect(prod.primary_image.includes(' (3).webp')).toBe(false);")
    content = content.replace("expect(media[0].url.endsWith('_light.webp')).toBe(true);",
                              "expect(media[0].url.endsWith('.webp')).toBe(true);")
    content = content.replace("expect(media[0].url.includes(' (2)_light.webp')).toBe(false);",
                              "expect(media[0].url.includes(' (2).webp')).toBe(false);")
    content = content.replace("expect(media[1].url.includes(' (2)_light.webp')).toBe(true);",
                              "expect(media[1].url.includes(' (2).webp')).toBe(true);")
    content = content.replace("expect(media[2].url.includes(' (3)_light.webp')).toBe(true);",
                              "expect(media[2].url.includes(' (3).webp')).toBe(true);")

    # Lotus Cooktop reordered test
    content = content.replace("expect(media[0].url.includes(' (2)_light.webp')).toBe(false);",
                              "expect(media[0].url.includes(' (2).webp')).toBe(false);")
    content = content.replace("expect(media[1].url.includes(' (2)_light.webp')).toBe(true);",
                              "expect(media[1].url.includes(' (2).webp')).toBe(true);")

    # Clean any temporary transparentCooktops / transparentIrons blocks from previous turn
    if 'const transparentCooktops =' in content:
        # replace the if/else with universal check
        content = re.sub(
            r"const transparentCooktops = \[.*?\];\s*products\.forEach\(\(p\) => \{\s*expect\(p\.primary_image\)\.toBeTruthy\(\);\s*if \(transparentCooktops\.includes\(p\.id\)\) \{.*?\} else \{.*?\}\s*\}\);",
            "products.forEach((p) => {\n      expect(p.primary_image).toBeTruthy();\n      expect(p.primary_image.endsWith('.webp')).toBe(true);\n      expect(p.primary_image.includes('_light.webp')).toBe(false);\n      expect(p.dark_image).toBeTruthy();\n      expect(p.dark_image.endsWith('.webp')).toBe(true);\n      expect(p.dark_image.includes('_dark.webp')).toBe(false);\n    });",
            content,
            flags=re.DOTALL
        )
        content = re.sub(
            r"mediaList\.forEach\(\(m\) => \{\s*expect\(m\.url\)\.toBeTruthy\(\);\s*if \(transparentCooktops\.includes\(m\.product_id\)\) \{.*?\} else \{.*?\}\s*\}\);",
            "mediaList.forEach((m) => {\n      expect(m.url).toBeTruthy();\n      expect(m.url.endsWith('.webp')).toBe(true);\n      expect(m.url.includes('_light.webp')).toBe(false);\n      expect(m.dark_url).toBeTruthy();\n      expect(m.dark_url.endsWith('.webp')).toBe(true);\n      expect(m.dark_url.includes('_dark.webp')).toBe(false);\n    });",
            content,
            flags=re.DOTALL
        )
        content = re.sub(
            r"const transparentCooktops = \[.*?\];\s*products\.forEach\(\(p\) => \{\s*if \(transparentCooktops\.includes\(p\.id\)\) \{.*?\} else \{.*?\}\s*\}\);",
            "products.forEach((p) => {\n      expect(p.primary_image.endsWith('.webp')).toBe(true);\n      expect(p.primary_image.includes('_light.webp')).toBe(false);\n      expect(p.dark_image.endsWith('.webp')).toBe(true);\n      expect(p.dark_image.includes('_dark.webp')).toBe(false);\n    });",
            content,
            flags=re.DOTALL
        )
        content = re.sub(
            r"if \(prodId === 'lotus-lt6455-black'\) \{\s*expect\(prod\.primary_image\.endsWith\('\.webp'\)\)\.toBe\(true\);.*?\}\s*const media",
            "expect(prod.primary_image.endsWith('.webp')).toBe(true);\n      expect(prod.primary_image.includes('_light.webp')).toBe(false);\n      expect(prod.dark_image.endsWith('.webp')).toBe(true);\n      expect(prod.dark_image.includes('_dark.webp')).toBe(false);\n\n      const media",
            content,
            flags=re.DOTALL
        )
        content = re.sub(
            r"if \(prodId === 'lotus-lt6455-black'\) \{\s*expect\(media\[0\]\.url\.endsWith\('\.webp'\)\)\.toBe\(true\);.*?\}\s*\}\);",
            "expect(media[0].url.endsWith('.webp')).toBe(true);\n      expect(media[0].url.includes(' (2).webp')).toBe(false);\n      expect(media[1].sort_order).toBe(1);\n      expect(media[1].url.includes(' (2).webp')).toBe(true);\n    });",
            content,
            flags=re.DOTALL
        )

    if 'if (p.id === \'lotus-lt-8803\')' in content:
        content = re.sub(
            r"products\.forEach\(\(p\) => \{\s*expect\(p\.primary_image\)\.toBeTruthy\(\);\s*if \(p\.id === 'lotus-lt-8803'\) \{.*?\} else \{.*?\}\s*\}\);",
            "products.forEach((p) => {\n      expect(p.primary_image).toBeTruthy();\n      expect(p.primary_image.endsWith('.webp')).toBe(true);\n      expect(p.primary_image.includes('_light.webp')).toBe(false);\n      expect(p.dark_image).toBeTruthy();\n      expect(p.dark_image.endsWith('.webp')).toBe(true);\n      expect(p.dark_image.includes('_dark.webp')).toBe(false);\n    });",
            content,
            flags=re.DOTALL
        )
        content = re.sub(
            r"mediaList\.forEach\(\(m\) => \{\s*expect\(m\.url\)\.toBeTruthy\(\);\s*if \(m\.product_id === 'lotus-lt-8803'\) \{.*?\} else \{.*?\}\s*expect\(m\.object_position\)",
            "mediaList.forEach((m) => {\n      expect(m.url).toBeTruthy();\n      expect(m.url.endsWith('.webp')).toBe(true);\n      expect(m.url.includes('_light.webp')).toBe(false);\n      expect(m.dark_url).toBeTruthy();\n      expect(m.dark_url.endsWith('.webp')).toBe(true);\n      expect(m.dark_url.includes('_dark.webp')).toBe(false);\n      expect(m.object_position)",
            content,
            flags=re.DOTALL
        )
        content = re.sub(
            r"products\.forEach\(\(p\) => \{\s*if \(p\.id === 'lotus-lt-8803'\) \{.*?\} else \{.*?\}\s*expect\(p\.image_position\)",
            "products.forEach((p) => {\n      expect(p.primary_image.endsWith('.webp')).toBe(true);\n      expect(p.primary_image.includes('_light.webp')).toBe(false);\n      expect(p.dark_image.endsWith('.webp')).toBe(true);\n      expect(p.dark_image.includes('_dark.webp')).toBe(false);\n      expect(p.image_position)",
            content,
            flags=re.DOTALL
        )

    if 'if (p.id === \'ardo-6331-gb\')' in content:
        content = re.sub(
            r"products\.forEach\(\(p\) => \{\s*expect\(p\.primary_image\)\.toBeTruthy\(\);\s*if \(p\.id === 'ardo-6331-gb'\) \{.*?\} else \{.*?\}\s*\}\);",
            "products.forEach((p) => {\n      expect(p.primary_image).toBeTruthy();\n      expect(p.primary_image.endsWith('.webp')).toBe(true);\n      expect(p.primary_image.includes('_light.webp')).toBe(false);\n      expect(p.dark_image).toBeTruthy();\n      expect(p.dark_image.endsWith('.webp')).toBe(true);\n      expect(p.dark_image.includes('_dark.webp')).toBe(false);\n    });",
            content,
            flags=re.DOTALL
        )
        content = re.sub(
            r"mediaList\.forEach\(\(m\) => \{\s*expect\(m\.url\)\.toBeTruthy\(\);\s*if \(m\.product_id === 'ardo-6331-gb'\) \{.*?\} else \{.*?\}\s*\}\);",
            "mediaList.forEach((m) => {\n      expect(m.url).toBeTruthy();\n      expect(m.url.endsWith('.webp')).toBe(true);\n      expect(m.url.includes('_light.webp')).toBe(false);\n      expect(m.dark_url).toBeTruthy();\n      expect(m.dark_url.endsWith('.webp')).toBe(true);\n      expect(m.dark_url.includes('_dark.webp')).toBe(false);\n    });",
            content,
            flags=re.DOTALL
        )
        content = re.sub(
            r"products\.forEach\(\(p\) => \{\s*if \(p\.id === 'ardo-6331-gb'\) \{.*?\} else \{.*?\}\s*\}\);",
            "products.forEach((p) => {\n      expect(p.primary_image.endsWith('.webp')).toBe(true);\n      expect(p.primary_image.includes('_light.webp')).toBe(false);\n      expect(p.dark_image.endsWith('.webp')).toBe(true);\n      expect(p.dark_image.includes('_dark.webp')).toBe(false);\n    });",
            content,
            flags=re.DOTALL
        )

    if content != orig:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'[UPDATED] {os.path.basename(filepath)}')
    else:
        print(f'[NO CHANGE] {os.path.basename(filepath)}')

for fp in sorted(glob.glob(f'{TEST_DIR}/*DatabaseAndMedia.test.ts')):
    update_test_file(fp)
