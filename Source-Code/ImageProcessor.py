import sys
from PIL import Image, ImageDraw, ImageFont
# 이게 python 으로 서버에 있는 SNS 공유 할수 있는 이미지들을 만들어 주기 위한 class 파일

class ImageProcessor:
    def __init__(self, mbti_type, text, font_path="NanumSquare.ttf", font_size=30):
        self.mbti_type = mbti_type
        self.text = text
        self.font = ImageFont.truetype(font_path, font_size)
        
    def open_image(self):
        # 이미지 열기
        self.image = Image.open(f"./MBTI/{self.mbti_type}.jpg")
        self.image_width, self.image_height = self.image.size

    def draw_text(self):
        # 이미지에 텍스트 쓰기
        draw = ImageDraw.Draw(self.image)
        text_width, text_height = draw.textsize(self.text, font=self.font)

        # 텍스트 위치 계산 (가운데 정렬)
        x = (self.image_width - text_width) // 2
        y = (self.image_height - text_height) // 2

        draw.text((x, 10), self.text, fill="black", font=self.font)  # 텍스트 쓰기 위치, 내용, 색상 (검정) 및 폰트 설정

    def save_image(self, path="./public/result.jpg"):
        # 결과 이미지 저장
        self.image.save(path)


if __name__ == "__main__":
    processor = ImageProcessor(sys.argv[1], sys.argv[2])
    processor.open_image()
    processor.draw_text()
    processor.save_image()
