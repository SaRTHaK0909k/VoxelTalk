import google.generativeai as genai
import ast
import json
from PIL import Image
from constants import GEMINI_API_KEY

try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(model_name="gemini-2.0-flash")
except Exception as e:
    print(f"Error configuring Generative AI: {e}")
    model = None


def analyse_image(img: Image, dict_of_vars: dict):
    try:
        print("Starting image analysis...")
        dict_of_vars_str = json.dumps(dict_of_vars, ensure_ascii=False)
        print(f"Variables context: {dict_of_vars_str}")
        print(f"GEMINI_API_KEY: {GEMINI_API_KEY[:5]}...")
        

        print("Sending to Gemini API...")
        prompt=(
            f"You have been given an image with some mathematical expressions, equations, or graphical problems, and you need to solve them. "
            f"Note: Use the PEMDAS rule for solving mathematical expressions. PEMDAS stands for the Priority Order: Parentheses, Exponents, Multiplication and Division (from left to right), Addition and Subtraction (from left to right). Parentheses have the highest priority, followed by Exponents, then Multiplication and Division, and lastly Addition and Subtraction. "
            f"For example: "
            f"Q. 2 + 3 * 4 "
            f"(3 * 4) => 12, 2 + 12 = 14. "
            f"Q. 2 + 3 + 5 * 4 - 8 / 2 "
            f"5 * 4 => 20, 8 / 2 => 4, 2 + 3 => 5, 5 + 20 => 25, 25 - 4 => 21. "
            f"YOU CAN HAVE FIVE TYPES OF EQUATIONS/EXPRESSIONS IN THIS IMAGE, AND ONLY ONE CASE SHALL APPLY EVERY TIME: "
            f"Following are the cases: "
            f"1. Simple mathematical expressions like 2 + 2, 3 * 4, 5 / 6, 7 - 8, etc.: In this case, solve and return the answer in the format of a LIST OF ONE DICT [{{'expr': given expression, 'result': calculated answer}}]. "
            f"2. Set of Equations like x^2 + 2x + 1 = 0, 3y + 4x = 0, 5x^2 + 6y + 7 = 12, etc.: In this case, solve for the given variable, and the format should be a COMMA SEPARATED LIST OF DICTS, with dict 1 as {{'expr': 'x', 'result': 2, 'assign': True}} and dict 2 as {{'expr': 'y', 'result': 5, 'assign': True}}. This example assumes x was calculated as 2, and y as 5. Include as many dicts as there are variables. "
            f"3. Assigning values to variables like x = 4, y = 5, z = 6, etc.: In this case, assign values to variables and return another key in the dict called {{'assign': True}}, keeping the variable as 'expr' and the value as 'result' in the original dictionary. RETURN AS A LIST OF DICTS. "
            f"4. Analyzing Graphical Math and Physics problems, which are word problems represented in drawing form, such as cars colliding, trigonometric problems, problems on the Pythagorean theorem, adding runs from a cricket wagon wheel, Projectile Motion etc. These will have a drawing representing some scenario and accompanying information with the image. PAY CLOSE ATTENTION TO DIFFERENT COLORS FOR THESE PROBLEMS. You need to return the answer in the format of a LIST OF ONE DICT [{{'expr': given expression, 'result': calculated answer}}]. "
            f"5. Detecting Abstract Concepts that a drawing might show, such as love, hate, jealousy, patriotism, or a historic reference to war, invention, discovery, quote, etc. USE THE SAME FORMAT AS OTHERS TO RETURN THE ANSWER, where 'expr' will be the explanation of the drawing, and 'result' will be the abstract concept. "
            f"Analyze the equation or expression in this image and return the answer according to the given rules: "
            f"Make sure to use extra backslashes for escape characters like \\f -> \\\\f, \\n -> \\\\n, etc. "
            f"Remove any question marks from the expression when returning it."
            f"In case of Physics problems with SI units provided in the question, return 'result' with proper value and SI units. Example: Distance = 5m, Speed = 1m/s, Time = 5s."
            f"Here is a dictionary of user-assigned variables. If the given expression has any of these variables, use its actual value from this dictionary accordingly: {dict_of_vars_str}. "
            f"DO NOT USE BACKTICKS OR MARKDOWN FORMATTING. "
            f"PROPERLY QUOTE THE KEYS AND VALUES IN THE DICTIONARY FOR EASIER PARSING WITH Python's ast.literal_eval."
        )
        response = model.generate_content([prompt, img])
        print("Raw Gemini response:", response.text)

        cleaned_text = response.text
        if "```json" in cleaned_text:
            cleaned_text = cleaned_text.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned_text:
            cleaned_text = cleaned_text.split("```")[1].split("```")[0].strip()

        print("Cleaned response:", cleaned_text)
        #answers = []
        try: 
            #answers = ast.literal_eval(response.text)
            answers = json.loads(cleaned_text)
            print("Parsed answers:", answers)

            # Ensure it's a list
            if not isinstance(answers, list):
                answers = [answers]
            
            # Add assign field if not present
            for answer in answers:
                if "assign" not in answer:
                    answer["assign"] = False
                    
            print("Final processed answers:", answers)
            return answers
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print("Failed to parse text:", cleaned_text)
            return []
        #print("returned answer ", answers)
        #for answer in answers:
            #if "assign" in answer:
                #answer["assign"] = True
            #else:
                #answer["assign"] = False
        #print("Final processed answers:", answers)
        #return answers
    except Exception as e:
        print(f"Error in analyse_image: {e}")
        raise

