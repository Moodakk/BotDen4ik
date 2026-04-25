# Common Czech patient phrases/complaints with Ukrainian translations and phonetic hints.

COMPLAINTS: list[dict] = [
    {
        "cs": "Bolí mě zub.",
        "uk": "У мене болить зуб.",
        "ph": "Болі мє зуб.",
    },
    {
        "cs": "Mám silnou bolest.",
        "uk": "У мене сильний біль.",
        "ph": "Мам сільноу болест.",
    },
    {
        "cs": "Bolest je pulzující.",
        "uk": "Біль пульсуючий.",
        "ph": "Болест є пулзуйіцї.",
    },
    {
        "cs": "Bolí mě, když jím.",
        "uk": "Мені боляче, коли я їм.",
        "ph": "Болі мє, кдиж йім.",
    },
    {
        "cs": "Bolí mě na studené/teplé.",
        "uk": "Болить на холодне/тепле.",
        "ph": "Болі мє на студене/тепле.",
    },
    {
        "cs": "Zub je citlivý.",
        "uk": "Зуб чутливий.",
        "ph": "Зуб є цітлівий.",
    },
    {
        "cs": "Mám oteklou tvář.",
        "uk": "У мене набрякла щока.",
        "ph": "Мам отекло твар.",
    },
    {
        "cs": "Vypadl mi zub.",
        "uk": "У мене випав зуб.",
        "ph": "Випадл мі зуб.",
    },
    {
        "cs": "Zlomil se mi zub.",
        "uk": "У мене зламався зуб.",
        "ph": "Зломіл се мі зуб.",
    },
    {
        "cs": "Mám krvácení dásní.",
        "uk": "У мене кровоточать ясна.",
        "ph": "Мам крвацені дасні.",
    },
    {
        "cs": "Mám špatný dech.",
        "uk": "У мене поганий запах з рота.",
        "ph": "Мам шпатний дех.",
    },
    {
        "cs": "Cítím nepříjemnou chuť v ústech.",
        "uk": "Я відчуваю неприємний смак у роті.",
        "ph": "Цітім непржіємноу хуть в устех.",
    },
    {
        "cs": "Mám potíže s kousáním.",
        "uk": "Мені важко жувати.",
        "ph": "Мам потіже с коусаням.",
    },
    {
        "cs": "Mám zlomenou korunka/zubní protézu.",
        "uk": "У мене зламалась коронка/протез.",
        "ph": "Мам зломеноу коронку/зубні протезу.",
    },
    {
        "cs": "Vypadla mi plomba.",
        "uk": "У мене випала пломба.",
        "ph": "Випадла мі пломба.",
    },
]

PATIENT_ANSWERS: list[dict] = [
    {
        "question_cs": "Jak dlouho vás to bolí?",
        "question_uk": "Як давно у вас болить?",
        "answers": [
            {"cs": "Od včera.", "uk": "З вчора."},
            {"cs": "Pár dní.", "uk": "Кілька днів."},
            {"cs": "Týden.", "uk": "Тиждень."},
            {"cs": "Déle než týden.", "uk": "Більше тижня."},
        ],
    },
    {
        "question_cs": "Kde to bolí? Ukažte prosím.",
        "question_uk": "Де болить? Покажіть, будь ласка.",
        "answers": [
            {"cs": "Tady.", "uk": "Тут."},
            {"cs": "Nahoře.", "uk": "Вгорі."},
            {"cs": "Dole.", "uk": "Внизу."},
            {"cs": "Vlevo.", "uk": "Зліва."},
            {"cs": "Vpravo.", "uk": "Справа."},
        ],
    },
    {
        "question_cs": "Jste alergický/á na nějaké léky?",
        "question_uk": "Ви маєте алергію на якісь ліки?",
        "answers": [
            {"cs": "Ano, na penicilín.", "uk": "Так, на пеніцилін."},
            {"cs": "Ano, na anestetika.", "uk": "Так, на анестетики."},
            {"cs": "Ne, nemám žádné alergie.", "uk": "Ні, у мене немає алергій."},
        ],
    },
]
