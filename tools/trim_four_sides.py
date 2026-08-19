#!/usr/bin/env python3
# ==============================================================================
# 使用方法1，消除特定檔案的四邊：
# python3 tools/trim_four_sides.py [多個目標檔案]
# 範例：
# python3 tools/trim_four_sides.py public/assets/items/rock_rolling.png public/assets/items/music_note.png
#
# 使用方法2，消除public/assets/item/, main_characters/, npc/ 其下所有檔案的四邊：
# 範例：
# python3 tools/trim_four_sides.py
# ==============================================================================


import os
import sys
from PIL import Image

def trim_image(file_path):
	"""
	Trim transparent borders of a PNG image in-place.
	Returns: 'trimmed', 'skipped', or 'error'
	"""
	try:
		if not os.path.exists(file_path):
			return 'error'

		with Image.open(file_path) as img:
			# Ensure image is in RGBA mode to read alpha channel correctly
			if img.mode != 'RGBA':
				img = img.convert('RGBA')

			# getbbox returns the bounding box of non-zero regions (non-transparent pixels)
			bbox = img.getbbox()

			if bbox:
				# If bbox is the same as image size, no trimming needed
				if bbox == (0, 0, img.size[0], img.size[1]):
					return 'skipped'

				cropped_img = img.crop(bbox)
				cropped_img.save(file_path, "PNG")
				print(f"Trimmed: {file_path} ({img.size[0]}x{img.size[1]} -> {cropped_img.size[0]}x{cropped_img.size[1]})")
				return 'trimmed'
			else:
				return 'skipped'
	except Exception as e:
		return 'error'

def get_png_files(directory):
	"""
	Recursively find all PNG files in the specified directory.
	"""
	png_files = []
	for root, _, files in os.walk(directory):
		for file in files:
			if file.lower().endswith('.png'):
				png_files.append(os.path.join(root, file))
	return png_files

def main():
	# Base directory is the assets directory under public/
	script_dir = os.path.dirname(os.path.abspath(__file__))
	base_dir = os.path.join(os.path.dirname(script_dir), 'public', 'assets')

	# Default subdirectories to process when no arguments are provided
	default_dirs = ['items', 'main_characters', 'npc', 'background_decorations']

	if len(sys.argv) > 1:
		# Process specific files or folders provided as arguments
		targets = sys.argv[1:]
		files_to_process = []

		for target in targets:
			# Try parsing target in several ways:
			# 1. As absolute path
			# 2. As relative path to current working directory
			# 3. As relative path to base_dir (public/assets/)
			resolved_path = None

			paths_to_check = [
				target,
				os.path.join(base_dir, target),
			]

			# If target doesn't end with .png, also check versions with .png appended
			if not target.lower().endswith('.png'):
				paths_to_check.append(target + '.png')
				paths_to_check.append(os.path.join(base_dir, target + '.png'))

			for p in paths_to_check:
				abs_p = os.path.abspath(p)
				if os.path.exists(abs_p):
					resolved_path = abs_p
					break

			if not resolved_path:
				print(f"Warning: Could not resolve target path: {target}")
				continue

			if os.path.isdir(resolved_path):
				files_to_process.extend(get_png_files(resolved_path))
			else:
				if resolved_path.lower().endswith('.png'):
					files_to_process.append(resolved_path)
				else:
					print(f"Warning: Target is not a PNG file: {resolved_path}")

		if not files_to_process:
			print("No valid PNG files found to process.")
			sys.exit(1)

		print(f"Processing {len(files_to_process)} asset(s)...\n")
		trimmed_count = 0
		error_count = 0
		error_files = []
		for f in files_to_process:
			result = trim_image(f)
			if result == 'trimmed':
				trimmed_count += 1
			elif result == 'error':
				error_count += 1
				error_files.append(f)

		if error_files:
			print("\n✗ Error processing:")
			for ef in error_files:
				print(f"  - {ef}")

		print(f"\n✓ Completed: {trimmed_count} trimmed, {error_count} failed, {len(files_to_process)} total scanned")

	else:
		# No arguments provided: Process default directories
		print(f"Scanning default directories under {base_dir}...\n")
		files_to_process = []
		for d in default_dirs:
			target_dir = os.path.join(base_dir, d)
			if os.path.exists(target_dir) and os.path.isdir(target_dir):
				files_to_process.extend(get_png_files(target_dir))

		if not files_to_process:
			print("No PNG files found in default directories.")
			sys.exit(0)

		trimmed_count = 0
		error_count = 0
		error_files = []
		for f in files_to_process:
			result = trim_image(f)
			if result == 'trimmed':
				trimmed_count += 1
			elif result == 'error':
				error_count += 1
				error_files.append(f)

		if error_files:
			print("\n✗ Error processing:")
			for ef in error_files:
				print(f"  - {ef}")

		print(f"\n✓ Completed: {trimmed_count} trimmed, {error_count} failed, {len(files_to_process)} total scanned")

if __name__ == '__main__':
	main()
