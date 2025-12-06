from fastapi import APIRouter
import base64
from io import BytesIO
from apps.calculator.utils import analyse_image
from schema import ImageData
from PIL import Image

router = APIRouter()

@router.post("")
async def run(data: ImageData):
    try: 
        print("Received request with vars:", data.dict_of_vars)
        try:
            image_data = base64.b64decode(data.image.split(",")[1])
            print("Base64 decoded successfully")
        except Exception as decode_error:
            print(f"Error decoding base64: {str(decode_error)}")
            raise
        image_bytes = BytesIO(image_data)
        image = Image.open(image_bytes)

        print("Image successfully decoded, size:", image.size)
        try:
            responses = analyse_image(image, dict_of_vars=data.dict_of_vars)
            print("Gemini API response received:", responses)
            
            if not responses:
                print("Warning: Empty response from Gemini API")
                return {
                    "message": "No results from image analysis",
                    "type": "warning",
                    "data": []
                }
                
            data = []
            for response in responses:
                data.append(response)
                
            print("Final processed response:", data)
            return {
                "message": "Image Processed",
                "type": "success",
                "data": data
            }
            
        except Exception as api_error:
            print(f"Error in Gemini API processing: {str(api_error)}")
            raise api_error
    except Exception as e:
        print("Error processing image:", str(e))
        raise