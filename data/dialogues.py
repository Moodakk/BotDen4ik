# Dialogues: questions the dentist asks the patient (Czech with Ukrainian translation).
# Grouped by stage of visit.

QUESTIONS: dict[str, list[dict]] = {
    "👋 Привітання / Uvítání": [
        {
            "cs": "Dobrý den! Jak se jmenujete?",
            "uk": "Добрий день! Як вас звуть?",
        },
        {
            "cs": "Jak se dnes cítíte?",
            "uk": "Як ви сьогодні почуваєтесь?",
        },
        {
            "cs": "Co vás přivádí?",
            "uk": "Що вас привело до нас?",
        },
        {
            "cs": "Máte objednaný termín?",
            "uk": "Ви записані на прийом?",
        },
    ],
    "📋 Анамнез / Anamnéza": [
        {
            "cs": "Máte nějaké zdravotní problémy?",
            "uk": "Чи маєте якісь проблеми зі здоров'ям?",
        },
        {
            "cs": "Berete nějaké léky?",
            "uk": "Ви приймаєте якісь ліки?",
        },
        {
            "cs": "Jste alergický/á na penicilín nebo jiné léky?",
            "uk": "У вас алергія на пеніцилін або інші ліки?",
        },
        {
            "cs": "Trpíte srdečním onemocněním?",
            "uk": "Ви страждаєте на серцеві захворювання?",
        },
        {
            "cs": "Máte cukrovku?",
            "uk": "Чи є у вас цукровий діабет?",
        },
        {
            "cs": "Jste těhotná?",
            "uk": "Ви вагітні?",
        },
        {
            "cs": "Kouříte?",
            "uk": "Ви курите?",
        },
        {
            "cs": "Kdy jste naposledy navštívil/a zubního lékaře?",
            "uk": "Коли ви востаннє відвідували стоматолога?",
        },
        {
            "cs": "Čistíte si zuby dvakrát denně?",
            "uk": "Ви чистите зуби двічі на день?",
        },
        {
            "cs": "Používáte zubní nit?",
            "uk": "Ви використовуєте зубну нитку?",
        },
    ],
    "🔍 Обстеження / Vyšetření": [
        {
            "cs": "Otevřete prosím ústa.",
            "uk": "Відкрийте, будь ласка, рот.",
        },
        {
            "cs": "Zavřete prosím ústa.",
            "uk": "Закрийте, будь ласка, рот.",
        },
        {
            "cs": "Trochu víc otevřete.",
            "uk": "Відкрийте трохи більше.",
        },
        {
            "cs": "Kde vás to bolí?",
            "uk": "Де у вас болить?",
        },
        {
            "cs": "Bolí to, když klepnu?",
            "uk": "Боляче, коли я постукую?",
        },
        {
            "cs": "Cítíte bolest při studené vodě?",
            "uk": "Ви відчуваєте біль від холодної води?",
        },
        {
            "cs": "Udělám rentgen.",
            "uk": "Я зроблю рентген.",
        },
    ],
    "💉 Анестезія / Anestezie": [
        {
            "cs": "Dám vám injekci na znecitlivění.",
            "uk": "Я зроблю вам укол для знеболення.",
        },
        {
            "cs": "Bude to trochu štípat.",
            "uk": "Це трохи защипне.",
        },
        {
            "cs": "Počkejte chvíli, než zabere anestezie.",
            "uk": "Зачекайте хвилинку, поки подіє анестезія.",
        },
        {
            "cs": "Cítíte ještě bolest?",
            "uk": "Ви ще відчуваєте біль?",
        },
        {
            "cs": "Cítíte tlak nebo bolest?",
            "uk": "Ви відчуваєте тиск чи біль?",
        },
    ],
    "🦷 Лікування / Léčba": [
        {
            "cs": "Vyčistím vám zub od kazu.",
            "uk": "Я очищу ваш зуб від карієсу.",
        },
        {
            "cs": "Dám vám plombu.",
            "uk": "Я поставлю вам пломбу.",
        },
        {
            "cs": "Zub musíme vytrhnout.",
            "uk": "Зуб потрібно видалити.",
        },
        {
            "cs": "Ošetřím kořenové kanálky.",
            "uk": "Я проліку кореневі канали.",
        },
        {
            "cs": "Potřebujete korunku.",
            "uk": "Вам потрібна коронка.",
        },
        {
            "cs": "Doporučuji implantát.",
            "uk": "Я рекомендую імплант.",
        },
        {
            "cs": "Bude to bezbolestné.",
            "uk": "Це буде безболісно.",
        },
        {
            "cs": "Potrvá to asi 30 minut.",
            "uk": "Це займе близько 30 хвилин.",
        },
    ],
    "📝 Рекомендації після лікування / Doporučení po léčbě": [
        {
            "cs": "Nejezte hodinu po zákroku.",
            "uk": "Не їжте годину після процедури.",
        },
        {
            "cs": "Nekuřte 24 hodin.",
            "uk": "Не куріть 24 години.",
        },
        {
            "cs": "Vyhněte se horké a studené stravě.",
            "uk": "Уникайте гарячої та холодної їжі.",
        },
        {
            "cs": "Vezměte si lék proti bolesti, pokud bude potřeba.",
            "uk": "Прийміть знеболювальне, якщо буде потрібно.",
        },
        {
            "cs": "Předepíšu vám antibiotika.",
            "uk": "Я випишу вам антибіотики.",
        },
        {
            "cs": "Přijďte za týden na kontrolu.",
            "uk": "Прийдіть через тиждень на контроль.",
        },
        {
            "cs": "Pokud bude bolest silná, zavolejte nám.",
            "uk": "Якщо біль буде сильним, зателефонуйте нам.",
        },
    ],
}
