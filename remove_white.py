from PIL import Image

def remove_white(image_path, output_path, tolerance=240):
    img = Image.open(image_path).convert('RGBA')
    data = img.getdata()
    new_data = []
    for item in data:
        if item[0] > tolerance and item[1] > tolerance and item[2] > tolerance:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    img.save(output_path, 'PNG')

remove_white('public/images/cartoon_pointing_v2.png', 'public/images/cartoon_pointing_v2_transparent.png')
remove_white('public/images/cartoon_thumbs_up_v2.png', 'public/images/cartoon_thumbs_up_v2_transparent.png')
