/* =========================================================
   Learn data for Grammar module
   - Dùng HTML nhỏ trong text để in đậm / nghiêng / highlight
   - Key = TÊN TOPIC đang hiển thị (song ngữ) → KHÔNG cần sửa CSV
   ========================================================= */

window.LEARN_DATA = {
  grammar: {
    "Tổng hợp": {
      title: "Tổng hợp Grammar",
      summary: "Bài luyện tập tổng hợp tất cả các chủ điểm ngữ pháp đã học 🧩.",
      points: [
        "📌 Bao gồm <b>tất cả</b> các dạng ngữ pháp trong chương trình",
        "🧠 Giúp con <b>ôn lại toàn diện</b>: nhớ nhanh – làm nhanh – ít sai",
        "⭐ Nên làm sau khi đã luyện từng topic riêng lẻ",
        "⏱ Làm lại nhiều lần để tăng phản xạ (mỗi lần cố gắng đúng hơn 1 chút!)",
        "✅ Mẹo: Nếu sai, hãy đọc phần <b>Explain</b> và xem lại <b>Learn</b> của đúng topic đó"
      ],
      examples: [
        { en: "This quiz includes many grammar topics.", vi: "Bài này bao gồm nhiều chủ điểm ngữ pháp." },
        { en: "Do your best and try again!", vi: "Hãy cố gắng và làm lại nhiều lần nhé!" },
        { en: "I made a mistake, so I will review the lesson.", vi: "Tớ làm sai nên tớ sẽ xem lại bài." }
      ],
      links: [
        {
          label: "📘 How to review grammar effectively",
          url: "https://www.youtube.com/results?search_query=english+grammar+revision+for+kids"
        }
      ]
    },

    /* =========================
      1. ADVERBS – TRẠNG TỪ
      ========================= */
    "Adverbs Trạng từ": {
      "title": "Adverbs (Trạng từ): Frequency, Degree & Manner",
      "summary": "Trạng từ giúp miêu tả <b>bao lâu một lần</b> (Frequency), <b>mức độ</b> (Degree) và <b>làm việc đó như thế nào</b> (Manner) 🧠.",
      "points": [
        "✅ <b>Định nghĩa:</b> Trạng từ bổ sung ý nghĩa cho động từ, tính từ hoặc cả câu.",
        "==============================",
        "<b>1) Adverbs of Frequency</b> (Tần suất) – trả lời: <b>How often?</b>",
        "• <b>Always</b> (Luôn luôn): 100%  |  • <b>Usually</b> (Thường thường): ~80%",
        "• <b>Often</b> (Thường xuyên): ~70%  |  • <b>Sometimes</b> (Thỉnh thoảng): ~50%",
        "• <b>Rarely</b> (Hiếm khi): ~10%  |  • <b>Never</b> (Không bao giờ): 0%",
        "📍 <b>Vị trí (Rất quan trọng):</b>",
        "   - Đứng <b>SAU</b> động từ To Be: (I <b>am always</b> happy).",
        "   - Đứng <b>TRƯỚC</b> động từ thường: (I <b>often go</b> to school).",
        "==============================",
        "<b>2) Adverbs of Manner</b> (Cách thức) – trả lời: <b>How?</b> (Làm thế nào?)",
        "📝 Công thức chung: <b>Tính từ + ly = Trạng từ</b>",
        "   - Slow → Slowly (chậm chạp)",
        "   - Careful → Carefully (cẩn thận)",
        "   - Happy → Happily (đổi 'y' thành 'i')",
        "⚠️ <b>Bất quy tắc (Phải nhớ để không bị bẫy):</b>",
        "   - Good → <b>Well</b> (Tốt/Giỏi)",
        "   - Fast → <b>Fast</b> (Nhanh - KHÔNG có fastly)",
        "   - Hard → <b>Hard</b> (Chăm chỉ/Vất vả)",
        "   - Late → <b>Late</b> (Trễ)",
        "==============================",
        "<b>3) Adverbs of Degree</b> (Mức độ) – nói về độ mạnh/yếu.",
        "• <b>Very</b> = rất (tích cực): <i>very good</i>",
        "• <b>Too</b> = quá (tiêu cực, không làm được): <i>too hot to eat</i>",
        "• <b>So</b> = quá/rất (nhấn mạnh cảm xúc): <i>so happy!</i>",
        "• <b>Almost</b> = gần như (sắp đạt được): <i>almost finished</i>",
        "• <b>Quite</b> = khá (mức độ vừa phải): <i>quite easy</i>",
        "==============================",
        "⭐ <b>MẸO LÀM BÀI SIÊU NHANH (5 RULES)</b> ⭐",
        "1️⃣ Thấy <b>to + V</b> đằng sau → chọn <b>Too</b> (Too... to...).",
        "2️⃣ Thấy động từ chỉ giác quan (<b>Look, Taste, Smell, Sound, Feel</b>) hoặc <b>To Be</b> → chọn <b>TÍNH TỪ</b>.",
        "   (Ex: You look <b>happy</b>. / The soup tastes <b>good</b>).",
        "3️⃣ Thấy <b>động từ thường</b> (run, sing, dance, learn) → chọn <b>TRẠNG TỪ</b>.",
        "   (Ex: He runs <b>fast</b>. / She sings <b>beautifully</b>).",
        "4️⃣ Muốn nói 'gần xong/gần hết' → chọn <b>Almost</b>.",
        "5️⃣ Muốn nhấn mạnh cảm xúc (!) → chọn <b>So</b>."
      ],
      "examples": [
        { "en": "I <b>always</b> go to school on time.", "vi": "Tớ <i>luôn luôn</i> đi học đúng giờ. (Tần suất)" },
        { "en": "He runs very <b>fast</b>. He is a <b>fast</b> runner.", "vi": "Cậu ấy chạy rất <i>nhanh</i>. (Trạng từ đặc biệt)" },
        { "en": "She sings <b>beautifully</b>.", "vi": "Cô ấy hát <i>hay</i>. (Động từ thường 'sings' + Trạng từ)" },
        { "en": "The soup tastes <b>good</b>.", "vi": "Món súp nếm <i>ngon</i>. (Động từ 'tastes' + Tính từ)" },
        { "en": "The bag is <b>too</b> heavy for me to carry.", "vi": "Cái túi <i>quá</i> nặng tớ không mang nổi. (Cấu trúc Too...to)" },
        { "en": "I am <b>almost</b> ready.", "vi": "Tớ <i>gần như</i> sẵn sàng rồi." }
      ],
      "links": [
        {
          "label": "▶ YouTube: Adverbs of Frequency Song",
          "url": "https://www.youtube.com/results?search_query=adverbs+of+frequency+song+for+kids"
        },
        {
          "label": "▶ YouTube: Adverbs vs Adjectives (Good vs Well)",
          "url": "https://www.youtube.com/results?search_query=adverbs+and+adjectives+song+for+kids"
        },
        {
          "label": "▶ YouTube: Very / Too / So / Quite",
          "url": "https://www.youtube.com/results?search_query=very+too+so+quite+grammar"
        }
      ]
    },
    /* =========================
      2. COMPARISON – SO SÁNH
      ========================= */
    "Comparison So sánh": {
      title: "Comparatives (So sánh hơn)",
      summary: "Dùng để so sánh <b>hai</b> người hoặc hai vật 📏.",
      points: [
        "✅ Cấu trúc chung: <b>... + comparative + than + ...</b>",
        "<b>Short adjectives</b> (từ ngắn): thêm <b>-er</b> (tall → taller) + <b>than</b>",
        "<b>Long adjectives</b> (từ dài): dùng <b>more</b> + adjective (beautiful → more beautiful) + <b>than</b>",
        "🔎 Quy tắc chính tả hay gặp:",
        "• big → <b>bigger</b> (gấp đôi phụ âm) | hot → <b>hotter</b>",
        "• happy → <b>happier</b> (y → ier)",
        "⭐ Bất quy tắc: good → <b>better</b>, bad → <b>worse</b>"
      ],
      examples: [
        { en: "A giraffe is <b>taller than</b> a horse.", vi: "Hươu cao cổ <i>cao hơn</i> con ngựa." },
        { en: "This book is <b>more interesting than</b> that one.", vi: "Cuốn sách này <i>thú vị hơn</i> cuốn kia." },
        { en: "Summer is <b>hotter than</b> winter.", vi: "Mùa hè <i>nóng hơn</i> mùa đông." },
        { en: "My bag is <b>bigger than</b> your bag.", vi: "Cặp của tớ <i>to hơn</i> cặp của cậu." }
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
      summary: "Nói về việc <b>sẽ</b> xảy ra trong tương lai hoặc dự đoán 🔮.",
      points: [
        "✅ Dạng khẳng định: <b>will</b> + V (I <b>will</b> go)",
        "✅ Dạng phủ định: <b>will not</b> = <b>won't</b> (I <b>won't</b> go)",
        "✅ Dạng câu hỏi: <b>Will</b> + S + V...? (Will you play?)",
        "📌 Từ khóa: tomorrow, next week, soon, later",
        "💡 Mẹo nhớ: 'will' thường dùng cho <b>dự đoán</b> (I think it will rain.)"
      ],
      examples: [
        { en: "I <b>will visit</b> my grandma tomorrow.", vi: "Tớ <i>sẽ thăm</i> bà vào ngày mai." },
        { en: "It <b>will rain</b> soon.", vi: "Trời <i>sẽ mưa</i> sớm thôi." },
        { en: "I <b>won't</b> forget my homework.", vi: "Tớ <i>sẽ không</i> quên bài tập về nhà đâu." },
        { en: "<b>Will</b> you help me? — Yes, I will.", vi: "<i>Bạn sẽ</i> giúp mình chứ? — Ừ, mình sẽ." }
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
      summary: "Những từ đặc biệt chỉ <b>khả năng</b>, <b>bắt buộc</b> hoặc <b>lời khuyên</b> 💪.",
      points: [
        "✅ Modal verbs + <b>V nguyên mẫu</b> (không thêm -s/-ed): He <b>can</b> swim (không phải cans)",
        "<b>Can</b>: Ability (Khả năng) – I can swim",
        "<b>Can't</b>: Cannot (Không thể) – I can't swim",
        "<b>Must</b>: Rules (Bắt buộc) – You must stop",
        "<b>Mustn't</b>: Forbidden (Cấm) – You mustn't run here",
        "<b>Should</b>: Advice (Lời khuyên) – You should eat vegetables",
        "<b>Shouldn't</b>: Không nên – You shouldn't eat too much candy"
      ],
      examples: [
        { en: "I <b>can</b> ride a bike.", vi: "Tớ <i>có thể</i> đi xe đạp." },
        { en: "You <b>must</b> listen to the teacher.", vi: "Bạn <i>phải</i> lắng nghe giáo viên." },
        { en: "You <b>should</b> brush your teeth twice a day.", vi: "Bạn <i>nên</i> đánh răng hai lần một ngày." },
        { en: "You <b>mustn't</b> play with fire.", vi: "Bạn <i>không được</i> chơi với lửa." }
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
      summary: "Kể về việc đã xảy ra và kết thúc trong quá khứ 🕰️.",
      points: [
        "✅ Dùng khi việc xảy ra <b>trong quá khứ</b> và <b>đã kết thúc</b>",
        "Regular verbs: thêm <b>-ed</b> (play → played, watch → watched)",
        "Irregular verbs: phải nhớ (go → went, eat → ate, see → saw)",
        "✅ Phủ định: <b>did not</b> = <b>didn't</b> + V (I didn't go)",
        "✅ Câu hỏi: <b>Did</b> + S + V...? (Did you play?)",
        "📌 Từ khóa: yesterday, last week, in 2020, ago"
      ],
      examples: [
        { en: "I <b>played</b> football yesterday.", vi: "Hôm qua tớ <i>đã chơi</i> bóng đá." },
        { en: "She <b>went</b> to the zoo last Sunday.", vi: "Cô ấy <i>đã đi</i> sở thú Chủ nhật tuần trước." },
        { en: "We <b>watched</b> a cartoon last night.", vi: "Chúng tớ <i>đã xem</i> hoạt hình tối qua." },
        { en: "I <b>didn't</b> go to school yesterday.", vi: "Hôm qua tớ <i>không</i> đi học." }
      ],
      links: [
        {
          label: "▶ YouTube: Past Simple Regular & Irregular",
          url: "https://www.youtube.com/results?search_query=past+simple+regular+and+irregular+verbs+for+kids"
        }
      ]
    },

    /* =========================
      6. PREPOSITIONS – GIỚI TỪ
      ========================= */
    "Prepositions Giới từ": {
      title: "Prepositions (In, On, At)",
      summary: "Các từ nhỏ xíu chỉ <b>thời gian</b> và <b>nơi chốn</b> 📍.",
      points: [
        "⏰ <b>Time</b> (Thời gian):",
        "<b>In</b>: months/years/seasons (in May, in 2025, in summer)",
        "<b>On</b>: days/dates (on Monday, on 5th May)",
        "<b>At</b>: exact time (at 7 o'clock, at 7:30)",
        "📍 <b>Place</b> (Nơi chốn):",
        "<b>In</b>: inside / enclosed places (in the box, in the room)",
        "<b>On</b>: on a surface (on the table, on the wall)",
        "<b>At</b>: specific place/point (at school, at the bus stop)"
      ],
      examples: [
        { en: "My birthday is <b>in</b> June.", vi: "Sinh nhật của tớ <i>vào</i> tháng Sáu." },
        { en: "I have English <b>on</b> Mondays.", vi: "Tớ có môn Tiếng Anh <i>vào</i> các ngày thứ Hai." },
        { en: "School starts <b>at</b> 7:30.", vi: "Trường học bắt đầu <i>lúc</i> 7:30." },
        { en: "The cat is <b>in</b> the box.", vi: "Con mèo ở <i>trong</i> cái hộp." }
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
      summary: "Diễn tả hành động <b>đang xảy ra</b> ngay lúc nói 🏃.",
      points: [
        "✅ Công thức: <b>am / is / are</b> + <b>V-ing</b>",
        "I am doing / He is playing / They are sleeping",
        "✅ Phủ định: am/is/are + <b>not</b> + V-ing (He is not playing)",
        "✅ Câu hỏi: <b>Am/Is/Are</b> + S + V-ing...? (Are you reading?)",
        "📌 Từ khóa: now, right now, at the moment",
        "🔎 Mẹo nhanh: 'now' thường đi với <b>Present Continuous</b>"
      ],
      examples: [
        { en: "I <b>am reading</b> a book now.", vi: "Tớ <i>đang đọc</i> sách ngay bây giờ." },
        { en: "Listen! The birds <b>are singing</b>.", vi: "Nghe kìa! Những chú chim <i>đang hót</i>." },
        { en: "She <b>is not</b> cooking. She is eating.", vi: "Cô ấy <i>không</i> nấu ăn. Cô ấy đang ăn." },
        { en: "<b>Are</b> you <b>doing</b> homework? — Yes, I am.", vi: "Bạn <i>đang làm</i> bài tập à? — Ừ, mình đang làm." }
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
      summary: "Nói về <b>thói quen</b> hoặc <b>sự thật</b> (hầu như đúng luôn) ☀️.",
      points: [
        "✅ Dùng cho thói quen: every day / usually / often",
        "✅ Dùng cho sự thật: The sun rises in the East.",
        "<b>He/She/It</b>: verb thêm <b>-s/-es</b> (He plays, She watches)",
        "✅ Phủ định: <b>don't</b> (I don't) / <b>doesn't</b> (He doesn't) + V",
        "✅ Câu hỏi: <b>Do</b> you...? / <b>Does</b> he...? (+ V nguyên mẫu)",
        "🔎 Mẹo phân biệt nhanh: Thói quen (present simple) ≠ đang diễn ra bây giờ (present continuous)"
      ],
      examples: [
        { en: "I <b>like</b> ice cream.", vi: "Tớ <i>thích</i> kem." },
        { en: "My dad <b>works</b> in a hospital.", vi: "Bố tớ <i>làm việc</i> ở bệnh viện." },
        { en: "The sun <b>rises</b> in the East.", vi: "Mặt trời <i>mọc</i> ở đằng Đông." },
        { en: "<b>Does</b> she <b>play</b> chess? — Yes, she does.", vi: "Bạn ấy <i>có chơi</i> cờ vua không? — Có." }
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
      summary: "Cách hỏi và nói về số lượng: <b>nhiều</b> hay <b>ít</b> 🍎.",
      points: [
        "✅ <b>How many</b> dùng cho danh từ đếm được: books, apples, pencils",
        "✅ <b>How much</b> dùng cho danh từ không đếm được: water, milk, money",
        "✅ <b>Some</b>: câu khẳng định / lời mời (I have some candy. / Would you like some?)",
        "✅ <b>Any</b>: câu hỏi & phủ định (Do you have any milk? / I don't have any milk.)",
        "💡 Mẹo nhỏ: Nếu đếm được (1,2,3...) → <b>many</b>; không đếm được → <b>much</b>"
      ],
      examples: [
        { en: "<b>How many</b> pencils do you have?", vi: "Bạn có <i>bao nhiêu</i> chiếc bút chì?" },
        { en: "I would like <b>some</b> water, please.", vi: "Cho tớ xin <i>một ít</i> nước nhé." },
        { en: "There isn't <b>any</b> juice in the fridge.", vi: "Không còn <i>chút</i> nước ép nào trong tủ lạnh cả." },
        { en: "Do you have <b>any</b> cookies?", vi: "Bạn có <i>cái bánh</i> nào không?" }
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
      summary: "Hỏi và trả lời: bây giờ là mấy giờ ⌚.",
      points: [
        "✅ Hỏi giờ: <b>What time is it?</b> / <b>What's the time?</b>",
        "<b>O'clock</b>: đúng giờ (7:00 → seven o'clock)",
        "<b>Half past</b>: 30 phút (7:30 → half past seven)",
        "<b>Quarter past</b>: 15 phút (7:15 → quarter past seven)",
        "<b>Quarter to</b>: còn 15 phút (7:45 → quarter to eight)",
        "✅ Nói giờ kiểu số: 9:30 → nine thirty"
      ],
      examples: [
        { en: "It is <b>seven o'clock</b> (7:00).", vi: "Bây giờ là <i>bảy giờ đúng</i>." },
        { en: "It is <b>half past ten</b> (10:30).", vi: "Bây giờ là <i>mười giờ rưỡi</i>." },
        { en: "It is <b>quarter to eight</b> (7:45).", vi: "Bây giờ là <i>tám giờ kém mười lăm</i>." },
        { en: "I go to bed at <b>nine thirty</b>.", vi: "Tớ đi ngủ lúc <i>chín giờ ba mươi</i>." }
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
        "<b>Living things</b> (Sinh vật sống): can grow, breathe, move (plants, animals)",
        "<b>Non-living things</b> (Vật không sống): cannot grow (car, teddy bear, rock)",
        "<b>Materials</b> (Vật liệu): wood (gỗ), metal (kim loại), glass (thủy tinh), plastic (nhựa)",
        "<b>Habitat</b> (Môi trường sống): where animals live (sea, land, forest)",
        "✅ Mẹo: Hãy hỏi: 'Nó có lớn lên không?' Nếu có → living thing"
      ],
      examples: [
        { en: "A tree is a <b>living thing</b> because it grows.", vi: "Cây là <i>sinh vật sống</i> vì nó lớn lên." },
        { en: "Dolphins live in the <b>sea</b>.", vi: "Cá heo sống ở <i>biển</i>." },
        { en: "This chair is made of <b>wood</b>.", vi: "Cái ghế này được làm bằng <i>gỗ</i>." },
        { en: "A rock is <b>non-living</b>.", vi: "Hòn đá là <i>vật không sống</i>." }
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
        "✅ Dùng <b>Wh-</b> để hỏi thông tin (không chỉ Yes/No).",
        "<b>Who</b>: Person (Ai?)",
        "<b>What</b>: Thing/Action (Cái gì?)",
        "<b>Where</b>: Place (Ở đâu?)",
        "<b>When</b>: Time (Khi nào?)",
        "<b>Why</b>: Reason (Tại sao?)",
        "<b>How</b>: Method/Feeling (Như thế nào?)",
        "💡 Mẹo: Trả lời nhanh theo đúng loại: Who → người, Where → nơi chốn, When → thời gian"
      ],
      examples: [
        { en: "<b>Where</b> is my bag?", vi: "Cặp của tớ <i>ở đâu</i>?" },
        { en: "<b>Who</b> is your best friend?", vi: "<i>Ai</i> là bạn thân nhất của cậu?" },
        { en: "<b>When</b> is your birthday?", vi: "Sinh nhật cậu là <i>khi nào</i>?" },
        { en: "<b>Why</b> are you happy? — Because it's my birthday!", vi: "Sao bạn vui thế? — Vì hôm nay là sinh nhật mình!" }
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
