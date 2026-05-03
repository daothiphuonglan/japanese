// components/home/KanaSection.tsx
import Container from "../layout/Container";

async function getKana() {
  const res = await fetch("http://localhost:3000/kana", {
    cache: "no-store", // hoặc dùng revalidate
  });

  return res.json();
}

export default async function KanaSection() {
  const { data } = await getKana();

  return (
    <>
      <Container>
        <section id="hiragana" className="py-16">
          <h2 className="text-2xl font-bold mb-6">
            Bảng chữ cái Hiragana
          </h2>

          <div className="grid grid-cols-5 gap-4">
            {data?.map((item: any) => (
              <a
                key={item.id}
                href={`/hiragana/${item.char}`}
                className="bg-white rounded-xl shadow p-6 text-center text-2xl hover:bg-blue-50"
              >
                {item.char}
              </a>
            ))}
          </div>
        </section>
      </Container>
      <iframe width="1351" height="480" src="https://www.youtube.com/embed/x9pixMubs8A" title="Học bảng chữ cái tiếng nhật Hiragana, Katakana trong 4H | Học tiếng Nhật cho người mới bắt đầu" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </>
  );
}