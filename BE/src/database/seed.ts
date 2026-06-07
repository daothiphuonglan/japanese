import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();



async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);


  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      name: 'Tech Lead',
      password: hashedPassword,
    },
  });

  await prisma.user.upsert({
    where: { email: 'member@gmail.com' },
    update: {},
    create: {
      email: 'member@gmail.com',
      name: 'member',
      password: hashedPassword,
    },
  });

  await prisma.user.upsert({
    where: { email: 'member2@gmail.com' },
    update: {},
    create: {
      email: 'member2@gmail.com',
      name: 'member2',
      password: hashedPassword,
    },
  });
  
  await prisma.kana.createMany({
  data: [
    // a-row
    { char: 'あ', romaji: 'a', type: 'hiragana' },
    { char: 'い', romaji: 'i', type: 'hiragana' },
    { char: 'う', romaji: 'u', type: 'hiragana' },
    { char: 'え', romaji: 'e', type: 'hiragana' },
    { char: 'お', romaji: 'o', type: 'hiragana' },

    // ka-row
    { char: 'か', romaji: 'ka', type: 'hiragana' },
    { char: 'き', romaji: 'ki', type: 'hiragana' },
    { char: 'く', romaji: 'ku', type: 'hiragana' },
    { char: 'け', romaji: 'ke', type: 'hiragana' },
    { char: 'こ', romaji: 'ko', type: 'hiragana' },

    // sa-row
    { char: 'さ', romaji: 'sa', type: 'hiragana' },
    { char: 'し', romaji: 'shi', type: 'hiragana' },
    { char: 'す', romaji: 'su', type: 'hiragana' },
    { char: 'せ', romaji: 'se', type: 'hiragana' },
    { char: 'そ', romaji: 'so', type: 'hiragana' },

    // ta-row
    { char: 'た', romaji: 'ta', type: 'hiragana' },
    { char: 'ち', romaji: 'chi', type: 'hiragana' },
    { char: 'つ', romaji: 'tsu', type: 'hiragana' },
    { char: 'て', romaji: 'te', type: 'hiragana' },
    { char: 'と', romaji: 'to', type: 'hiragana' },

    // na-row
    { char: 'な', romaji: 'na', type: 'hiragana' },
    { char: 'に', romaji: 'ni', type: 'hiragana' },
    { char: 'ぬ', romaji: 'nu', type: 'hiragana' },
    { char: 'ね', romaji: 'ne', type: 'hiragana' },
    { char: 'の', romaji: 'no', type: 'hiragana' },

    // ha-row
    { char: 'は', romaji: 'ha', type: 'hiragana' },
    { char: 'ひ', romaji: 'hi', type: 'hiragana' },
    { char: 'ふ', romaji: 'fu', type: 'hiragana' },
    { char: 'へ', romaji: 'he', type: 'hiragana' },
    { char: 'ほ', romaji: 'ho', type: 'hiragana' },

    // ma-row
    { char: 'ま', romaji: 'ma', type: 'hiragana' },
    { char: 'み', romaji: 'mi', type: 'hiragana' },
    { char: 'む', romaji: 'mu', type: 'hiragana' },
    { char: 'め', romaji: 'me', type: 'hiragana' },
    { char: 'も', romaji: 'mo', type: 'hiragana' },

    // ya-row
    { char: 'や', romaji: 'ya', type: 'hiragana' },
    { char: 'ゆ', romaji: 'yu', type: 'hiragana' },
    { char: 'よ', romaji: 'yo', type: 'hiragana' },

    // ra-row
    { char: 'ら', romaji: 'ra', type: 'hiragana' },
    { char: 'り', romaji: 'ri', type: 'hiragana' },
    { char: 'る', romaji: 'ru', type: 'hiragana' },
    { char: 'れ', romaji: 're', type: 'hiragana' },
    { char: 'ろ', romaji: 'ro', type: 'hiragana' },

    // wa-row
    { char: 'わ', romaji: 'wa', type: 'hiragana' },
    { char: 'を', romaji: 'wo', type: 'hiragana' },

    // n
    { char: 'ん', romaji: 'n', type: 'hiragana' },
  ],
});
}

main()
  .then(() => console.log('Seed done'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());