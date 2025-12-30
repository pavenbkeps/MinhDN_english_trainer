/* =========================================================
   Learn data for Grammar module
   - Dùng HTML nhỏ trong text để in đậm / nghiêng / highlight
   - Key = TÊN TOPIC đang hiển thị (song ngữ) → KHÔNG cần sửa CSV
   ========================================================= */

window.LEARN_DATA = {
  grammar: {
  "Tổng hợp": {
      title: "Tổng hợp Grammar",
      summary: "Bài luyện tập tổng hợp tất cả các chủ điểm ngữ pháp đã học.",
      points: [
        "📌 Bao gồm <b>tất cả</b> các dạng ngữ pháp trong chương trình",
        "🧠 Giúp con <b>ôn lại toàn diện</b> kiến thức đã học",
        "⭐ Nên làm sau khi đã luyện từng topic riêng lẻ",
        "⏱ Có thể làm nhiều lần để tăng phản xạ"
      ],
      examples: [
        {
          en: "This quiz includes many grammar topics.",
          vi: "Bài này bao gồm nhiều chủ điểm ngữ pháp."
        },
        {
          en: "Do your best and try again!",
          vi: "Hãy cố gắng và làm lại nhiều lần nhé!"
        }
      ],
      links: [
        {
          label: "📘 How to review grammar effectively",
          url: "https://www.youtube.com/results?search_query=english+grammar+revision+for+kids"
        }
      ]
    },

    // các topic grammar khác… 
        
    /* =========================
      1. ADVERBS – TRẠNG TỪ
      ========================= */
    "Adverbs Trạng từ": {
      title: "Adverbs of Frequency (Trạng từ chỉ tần suất)",
      summary: "Những từ chỉ mức độ thường xuyên bạn làm một việc gì đó 📅.",
      points: [
        "<b>Always</b> (Luôn luôn): 100% (Every day)",
        "<b>Usually</b> (Thường thường): 80%",
        "<b>Sometimes</b> (Thỉnh thoảng): 50%",
        "<b>Never</b> (Không bao giờ): 0%",
        "Position: Before the verb (I <b>always</b> run) or after 'to be' (I am <b>never</b> late)"
      ],
      examples: [
        {
          en: "I <b>always</b> brush my teeth before bed.",
          vi: "Tớ <i>luôn luôn</i> đánh răng trước khi đi ngủ."
        },
        {
          en: "He <b>sometimes</b> plays football on Sundays.",
          vi: "Cậu ấy <i>thỉnh thoảng</i> chơi bóng đá vào Chủ nhật."
        },
        {
          en: "We are <b>never</b> late for school.",
          vi: "Chúng tớ <i>không bao giờ</i> đi học muộn."
        }
      ],
      links: [
        {
          label: "▶ YouTube: Adverbs of Frequency Song",
          url: "https://www.youtube.com/results?search_query=adverbs+of+frequency+song+for+kids"
        }
      ]
    },

    /* =========================
      2. COMPARISON – SO SÁNH
      ========================= */
    "Comparison So sánh": {
      title: "Comparatives (So sánh hơn)",
      summary: "Dùng để so sánh sự khác nhau giữa hai người hoặc hai vật 📏.",
      points: [
        "<b>Short adjectives</b> (Từ ngắn): add <b>-er</b> + than (tall → taller than)",
        "<b>Long adjectives</b> (Từ dài): use <b>more</b> + word + <b>than</b> (beautiful → more beautiful than)",
        "Irregular: good → better, bad → worse"
      ],
      examples: [
        {
          en: "A giraffe is <b>taller than</b> a horse.",
          vi: "Hươu cao cổ <i>cao hơn</i> con ngựa."
        },
        {
          en: "This book is <b>more interesting than</b> that one.",
          vi: "Cuốn sách này <i>thú vị hơn</i> cuốn kia."
        },
        {
          en: "Summer is <b>hotter than</b> winter.",
          vi: "Mùa hè <i>nóng hơn</i> mùa đông."
        }
      ],
      links: [
        {
          label: "▶ YouTube: Comparatives for Kids",
          url: "https://www.youtube.com/results?search_query=comparatives+grammar+for+kids"
        }
      ]
    },

    /* =========================
      3. FUTURE SIMPLE – TƯƠNG LAI ĐƠN
      ========================= */
    "Future Simple Thì tương lai đơn": {
      title: "Future Simple (Thì tương lai đơn)",
      summary: "Nói về những việc sẽ xảy ra trong tương lai hoặc dự đoán 🔮.",
      points: [
        "Positive: <b>Will</b> + Verb (I will go)",
        "Negative: <b>Will not</b> = <b>Won't</b> (I won't go)",
        "Keywords: tomorrow, next week, soon"
      ],
      examples: [
        {
          en: "I <b>will visit</b> my grandma tomorrow.",
          vi: "Tớ <i>sẽ thăm</i> bà vào ngày mai."
        },
        {
          en: "It <b>will rain</b> soon.",
          vi: "Trời <i>sẽ mưa</i> sớm thôi."
        },
        {
          en: "I <b>won't</b> forget my homework.",
          vi: "Tớ <i>sẽ không</i> quên bài tập về nhà đâu."
        }
      ],
      links: [
        {
          label: "▶ YouTube: Future Simple Will/Won't",
          url: "https://www.youtube.com/results?search_query=future+simple+will+for+kids"
        }
      ]
    },

    /* =========================
      4. MODAL VERBS – ĐỘNG TỪ KHUYẾT THIẾU
      ========================= */
    "Modal Verbs Động từ khuyết thiếu": {
      title: "Modal Verbs (Can, Must, Should)",
      summary: "Những từ đặc biệt chỉ khả năng, luật lệ hoặc lời khuyên 💪.",
      points: [
        "<b>Can</b>: Ability (Khả năng) – I can swim",
        "<b>Must</b>: Rules (Bắt buộc) – You must stop",
        "<b>Should</b>: Advice (Lời khuyên) – You should eat vegetables"
      ],
      examples: [
        {
          en: "I <b>can</b> ride a bike.",
          vi: "Tớ <i>có thể</i> đi xe đạp."
        },
        {
          en: "You <b>must</b> listen to the teacher.",
          vi: "Bạn <i>phải</i> lắng nghe giáo viên."
        },
        {
          en: "You <b>should</b> brush your teeth twice a day.",
          vi: "Bạn <i>nên</i> đánh răng hai lần một ngày."
        }
      ],
      links: [
        {
          label: "▶ YouTube: Modal Verbs Song",
          url: "https://www.youtube.com/results?search_query=can+must+should+for+kids"
        }
      ]
    },

    /* =========================
      5. PAST SIMPLE – QUÁ KHỨ ĐƠN
      ========================= */
    "Past Simple Thì quá khứ đơn": {
      title: "Past Simple (Thì quá khứ đơn)",
      summary: "Kể về những việc đã xảy ra và kết thúc trong quá khứ 🕰️.",
      points: [
        "Regular verbs: add <b>-ed</b> (play → played, watch → watched)",
        "Irregular verbs: must learn by heart (go → went, eat → ate, see → saw)",
        "Keywords: yesterday, last week, in 2020"
      ],
      examples: [
        {
          en: "I <b>played</b> football yesterday.",
          vi: "Hôm qua tớ <i>đã chơi</i> bóng đá."
        },
        {
          en: "She <b>went</b> to the zoo last Sunday.",
          vi: "Cô ấy <i>đã đi</i> sở thú Chủ nhật tuần trước."
        },
        {
          en: "We <b>watched</b> a cartoon last night.",
          vi: "Chúng tớ <i>đã xem</i> hoạt hình tối qua."
        }
      ],
      links: [
        {
          label: "▶ YouTube: Past Simple Regular Verbs",
          url: "https://www.youtube.com/results?search_query=past+simple+for+kids"
        }
      ]
    },

    /* =========================
      6. PREPOSITIONS – GIỚI TỪ
      ========================= */
    "Prepositions Giới từ": {
      title: "Prepositions (In, On, At)",
      summary: "Các từ nhỏ xíu chỉ thời gian và nơi chốn 📍.",
      points: [
        "<b>In</b>: Months, Years, Seasons, enclosed places (in May, in the box)",
        "<b>On</b>: Days, Dates, surfaces (on Monday, on the table)",
        "<b>At</b>: Exact time, specific places (at 7 o'clock, at school)"
      ],
      examples: [
        {
          en: "My birthday is <b>in</b> June.",
          vi: "Sinh nhật của tớ <i>vào</i> tháng Sáu."
        },
        {
          en: "I have English <b>on</b> Mondays.",
          vi: "Tớ có môn Tiếng Anh <i>vào</i> các ngày thứ Hai."
        },
        {
          en: "School starts <b>at</b> 7:30.",
          vi: "Trường học bắt đầu <i>lúc</i> 7:30."
        }
      ],
      links: [
        {
          label: "▶ YouTube: In On At Song",
          url: "https://www.youtube.com/results?search_query=in+on+at+prepositions+song"
        }
      ]
    },

    /* =========================
      7. PRESENT CONTINUOUS – HIỆN TẠI TIẾP DIỄN
      ========================= */
    "Present Continuous Thì hiện tại tiếp diễn": {
      title: "Present Continuous (Hiện tại tiếp diễn)",
      summary: "Diễn tả hành động đang xảy ra ngay lúc nói 🏃.",
      points: [
        "Formula: <b>am / is / are</b> + <b>Verb-ing</b>",
        "I am doing / He is playing / They are sleeping",
        "Keywords: now, right now, at the moment"
      ],
      examples: [
        {
          en: "I <b>am reading</b> a book now.",
          vi: "Tớ <i>đang đọc</i> sách ngay bây giờ."
        },
        {
          en: "Listen! The birds <b>are singing</b>.",
          vi: "Nghe kìa! Những chú chim <i>đang hót</i>."
        },
        {
          en: "She <b>is not</b> cooking. She is eating.",
          vi: "Cô ấy <i>đang không</i> nấu ăn. Cô ấy đang ăn."
        }
      ],
      links: [
        {
          label: "▶ YouTube: Present Continuous Action Verbs",
          url: "https://www.youtube.com/results?search_query=present+continuous+for+kids"
        }
      ]
    },

    /* =========================
      8. PRESENT SIMPLE – HIỆN TẠI ĐƠN
      ========================= */
    "Present Simple Thì hiện tại đơn": {
      title: "Present Simple (Thì hiện tại đơn)",
      summary: "Nói về thói quen hàng ngày hoặc sự thật hiển nhiên ☀️.",
      points: [
        "<b>Habits</b>: I get up at 6:00 every day.",
        "<b>He/She/It</b>: Verb must add <b>-s</b> or <b>-es</b> (He plays, She watches)",
        "Don't / Doesn't in negative sentences."
      ],
      examples: [
        {
          en: "I <b>like</b> ice cream.",
          vi: "Tớ <i>thích</i> kem."
        },
        {
          en: "My dad <b>works</b> in a hospital.",
          vi: "Bố tớ <i>làm việc</i> ở bệnh viện."
        },
        {
          en: "The sun <b>rises</b> in the East.",
          vi: "Mặt trời <i>mọc</i> ở đằng Đông."
        }
      ],
      links: [
        {
          label: "▶ YouTube: Present Simple Tense",
          url: "https://www.youtube.com/results?search_query=present+simple+tense+for+kids"
        }
      ]
    },

    /* =========================
      9. QUANTIFIERS – LƯỢNG TỪ
      ========================= */
    "Quantifiers Lượng từ": {
      title: "Quantifiers (Từ chỉ số lượng)",
      summary: "Cách hỏi và nói về số lượng nhiều hay ít 🍎.",
      points: [
        "<b>How many</b>: Countable nouns (books, apples)",
        "<b>How much</b>: Uncountable nouns (water, money)",
        "<b>Some</b>: Positive sentences (I have some candy)",
        "<b>Any</b>: Questions/Negatives (Do you have any milk?)"
      ],
      examples: [
        {
          en: "<b>How many</b> pencils do you have?",
          vi: "Bạn có <i>bao nhiêu</i> chiếc bút chì?"
        },
        {
          en: "I would like <b>some</b> water, please.",
          vi: "Cho tớ xin <i>một ít</i> nước nhé."
        },
        {
          en: "There isn't <b>any</b> juice in the fridge.",
          vi: "Không còn <i>chút</i> nước ép nào trong tủ lạnh cả."
        }
      ],
      links: [
        {
          label: "▶ YouTube: Some and Any / Much and Many",
          url: "https://www.youtube.com/results?search_query=quantifiers+for+kids+grammar"
        }
      ]
    },

    /* =========================
      10. TELLING TIME – THỜI GIAN
      ========================= */
    "Telling Time Thời gian": {
      title: "Telling Time (Cách nói giờ)",
      summary: "Hỏi và trả lời bây giờ là mấy giờ ⌚.",
      points: [
        "Question: <b>What time is it?</b>",
        "<b>O'clock</b>: Right on the hour (7:00 -> seven o'clock)",
        "<b>Half past</b>: 30 minutes (7:30 -> half past seven)",
        "<b>Quarter past</b>: 15 minutes (7:15 -> quarter past seven)"
      ],
      examples: [
        {
          en: "It is <b>seven o'clock</b> (7:00).",
          vi: "Bây giờ là <i>bảy giờ đúng</i>."
        },
        {
          en: "It is <b>half past ten</b> (10:30).",
          vi: "Bây giờ là <i>mười giờ rưỡi</i>."
        },
        {
          en: "I go to bed at <b>nine thirty</b>.",
          vi: "Tớ đi ngủ lúc <i>chín giờ ba mươi</i>."
        }
      ],
      links: [
        {
          label: "▶ YouTube: Telling Time Song",
          url: "https://www.youtube.com/results?search_query=telling+time+song+for+kids"
        }
      ]
    },

    /* =========================
      11. UNI REVISION (SCIENCE & LIFE)
      ========================= */
    "UNI REVISION - 12/2025 - GRADE 3": {
      title: "Science & Life (Khoa học & Đời sống)",
      summary: "Ôn tập kiến thức về thế giới tự nhiên và vật liệu 🌍.",
      points: [
        "<b>Living things</b> (Sinh vật sống): can grow, breathe, move (Plants, Animals)",
        "<b>Non-living things</b> (Vật không sống): cannot grow (Car, Teddy bear)",
        "<b>Materials</b>: Wood (gỗ), Metal (kim loại), Glass (thủy tinh)",
        "<b>Habitat</b>: Where animals live (Sea, Land, Forest)"
      ],
      examples: [
        {
          en: "A tree is a <b>living thing</b> because it grows.",
          vi: "Cây là <i>sinh vật sống</i> vì nó lớn lên."
        },
        {
          en: "Dolphins live in the <b>sea</b>.",
          vi: "Cá heo sống ở <i>biển</i>."
        },
        {
          en: "This chair is made of <b>wood</b>.",
          vi: "Cái ghế này được làm bằng <i>gỗ</i>."
        }
      ],
      links: [
        {
          label: "▶ YouTube: Living and Non-living Things",
          url: "https://www.youtube.com/results?search_query=living+and+non+living+things+for+kids"
        }
      ]
    },

    /* =========================
      12. WH-QUESTIONS – CÂU HỎI WH
      ========================= */
    "Wh-Questions Câu hỏi Wh...": {
      title: "Wh-Questions (Các từ để hỏi)",
      summary: "Các từ dùng để bắt đầu một câu hỏi thông tin 🤔.",
      points: [
        "<b>Who</b>: Person (Ai?)",
        "<b>What</b>: Thing/Action (Cái gì?)",
        "<b>Where</b>: Place (Ở đâu?)",
        "<b>When</b>: Time (Khi nào?)",
        "<b>Why</b>: Reason (Tại sao?)",
        "<b>How</b>: Method/Feeling (Như thế nào?)"
      ],
      examples: [
        {
          en: "<b>Where</b> is my bag?",
          vi: "Cặp của tớ <i>ở đâu</i>?"
        },
        {
          en: "<b>Who</b> is your best friend?",
          vi: "<i>Ai</i> là bạn thân nhất của cậu?"
        },
        {
          en: "<b>When</b> is your birthday?",
          vi: "Sinh nhật cậu là <i>khi nào</i>?"
        }
      ],
      links: [
        {
          label: "▶ YouTube: Wh-Questions Song",
          url: "https://www.youtube.com/results?search_query=wh+questions+song+for+kids"
        }
      ]
  }
  }
};
