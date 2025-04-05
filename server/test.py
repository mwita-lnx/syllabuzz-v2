import fitz  # PyMuPDF
import os
import base64
import re

def convert_pdf_to_html(pdf_path, output_folder):
    # Create output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)
    
    # Open the PDF
    doc = fitz.open(pdf_path)
    
    # Add CSS styling for better appearance with highlighted headers
    css_styles = """
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #ffffff;
            background-color: #2c3e50;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            font-size: 28px;
            margin-top: 40px;
            box-shadow: 0 3px 5px rgba(0,0,0,0.2);
        }
        h2 {
            color: #ffffff;
            background-color: #3498db;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            font-size: 22px;
            margin-top: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h3 {
            color: #ffffff;
            background-color: #5dade2;
            padding: 8px;
            border-radius: 4px;
            text-align: center;
            font-size: 18px;
            margin-top: 25px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        p {
            margin-bottom: 16px;
            text-align: justify;
        }
        img {
            max-width: 100%;
            height: auto;
            margin: 20px auto;
            border: 1px solid #eee;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            display: block;
        }
        .container {
            background-color: #ffffff;
            box-shadow: 0 0 15px rgba(0,0,0,0.1);
            border-radius: 8px;
            padding: 30px;
        }
    </style>
    """
    
    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Converted Document</title>
    {css_styles}
</head>
<body>
    <div class="container">
"""
    
    # Extract images folder
    images_folder = os.path.join(output_folder, "images")
    os.makedirs(images_folder, exist_ok=True)
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Extract text with blocks
        blocks = page.get_text("blocks")
        
        # Extract images
        images = page.get_images(full=True)
        
        for img_index, img in enumerate(images):
            xref = img[0]
            base_img = doc.extract_image(xref)
            image_bytes = base_img["image"]
            
            # Save image
            image_filename = f"image_p{page_num+1}_{img_index}.png"
            image_path = os.path.join(images_folder, image_filename)
            
            with open(image_path, "wb") as img_file:
                img_file.write(image_bytes)
            
            # Add image to HTML
            img_tag = f'<img src="images/{image_filename}" alt="Image {img_index} on page {page_num+1}">\n'
            html_content += img_tag
        
        # Process text blocks with formatting
        for block in blocks:
            text = block[4]
            
            # Improved heading detection
            if text.strip():
                # Clean the text of extra whitespace
                clean_text = text.strip()
                
                # Check for header patterns
                if len(clean_text) < 60 and (clean_text.endswith(':') or clean_text.isupper()):
                    html_content += f"<h1>{clean_text}</h1>\n"
                elif len(clean_text) < 80 and clean_text.strip().endswith('\n'):
                    if any(word in clean_text.lower() for word in ["chapter", "section", "unit", "part", "lecture"]):
                        html_content += f"<h1>{clean_text}</h1>\n"
                    else:
                        html_content += f"<h2>{clean_text}</h2>\n"
                elif len(clean_text) < 100 and any(clean_text.lower().startswith(h) for h in ["topic", "subject", "theme"]):
                    html_content += f"<h3>{clean_text}</h3>\n"
                else:
                    html_content += f"<p>{clean_text}</p>\n"
    
    html_content += """
    </div>
</body>
</html>"""
    
    # Write HTML file
    with open(os.path.join(output_folder, "output.html"), "w", encoding="utf-8") as html_file:
        html_file.write(html_content)
    
    print(f"Conversion completed. Output in {output_folder}")

# Usage
convert_pdf_to_html("sample_notes.pdf", "output_folder")