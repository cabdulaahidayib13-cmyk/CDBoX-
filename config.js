export const PACKS = [
  {
    name: "Basic Pack",
    cost: 100,
    code: "basic",
    probabilities: [
      {stars:"⭐", percent:30, card:"cards/1.png"},
      {stars:"⭐⭐", percent:30, card:"cards/2.png"},
      {stars:"⭐⭐⭐", percent:28, card:"cards/3.png"},
      {stars:"⭐⭐⭐⭐", percent:10, card:"cards/4.png"},
      {stars:"⭐⭐⭐⭐⭐", percent:2, card:"cards/5.png"},
    ],
    dailyLimit: 500,
  },
  {
    name: "Pro Pack",
    cost: 1000,
    code: "pro",
    probabilities: [
      {stars:"⭐⭐", percent:20, card:"cards/2.png"},
      {stars:"⭐⭐⭐", percent:25, card:"cards/3.png"},
      {stars:"⭐⭐⭐⭐", percent:25, card:"cards/6.png"},
      {stars:"⭐⭐⭐⭐⭐", percent:20, card:"cards/7.png"},
      {stars:"⭐⭐⭐⭐⭐⭐", percent:10, card:"cards/8.png"},
    ],
    dailyLimit: 300,
  },
  {
    name: "Elite Pack",
    cost: 10000,
    code: "elite",
    probabilities: [
      {stars:"⭐⭐⭐⭐⭐", percent:25, card:"cards/7.png"},
      {stars:"⭐⭐⭐⭐⭐⭐", percent:25, card:"cards/8.png"},
      {stars:"⭐⭐⭐⭐⭐⭐⭐", percent:24, card:"cards/9.png"},
      {stars:"⭐⭐⭐⭐⭐⭐⭐⭐", percent:20, card:"cards/10.png"},
      {stars:"⭐⭐⭐⭐⭐⭐⭐⭐⭐", percent:6, card:"cards/special.png"},
    ],
    dailyLimit: 100,
  }
];