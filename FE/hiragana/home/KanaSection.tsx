// components/home/KanaSection.tsx
import DialogHiragana from "@/components/DialogHiragana/Dialog";
import Container from "../layout/Container";
// import {
//   Dialog,
//   DialogTrigger,
// } from "@/components/ui/dialog"

import DrawCanvas from "@/components/DrawCanvas";
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
    <Dialog key={item.id}>
      <DialogTrigger asChild>
        <Button className="bg-white rounded-xl shadow p-6 text-2xl hover:bg-blue-50 text-black">
          {item.char}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-purple-400">Chữ cái: {item.char}</DialogTitle>
          <DialogDescription>
            Hãy luyện viết theo nét nhé ✍️
          </DialogDescription>
        </DialogHeader>

        {/* HIỂN THỊ CHỮ */}
        <div className="text-center text-4xl font-bold">
          {item.char}
        </div>

        {/* CANVAS */}
        <DrawCanvas />

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ))}
</div>
        </section>
      </Container>
      <iframe width="1351" height="480" src="https://www.youtube.com/embed/x9pixMubs8A" title="Học bảng chữ cái tiếng nhật Hiragana, Katakana trong 4H | Học tiếng Nhật cho người mới bắt đầu" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" ></iframe>
    </>
  );
}