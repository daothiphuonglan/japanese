// components/home/SeoContent.tsx
import Container from "../layout/Container";

export default function SeoContent() {
  return (
    <Container>
      <section className="max-w-3xl mx-auto py-16">
        <h2 className="text-2xl font-bold">
          Hiragana là gì?
        </h2>

        <p className="mt-4 text-gray-600">
          Hiragana là bảng chữ cái cơ bản trong tiếng Nhật, được sử dụng để viết
          các từ thuần Nhật. Đây là bước đầu tiên cho người mới bắt đầu học tiếng Nhật.
        </p>

        <h2 className="text-2xl font-bold mt-10">
          Cách học bảng chữ cái tiếng Nhật nhanh
        </h2>

        <p className="mt-4 text-gray-600">
          Để học Hiragana hiệu quả, bạn nên kết hợp giữa việc ghi nhớ hình dạng,
          nghe phát âm và luyện tập thường xuyên qua flashcard hoặc quiz.
        </p>
      </section>
    </Container>
  );
}