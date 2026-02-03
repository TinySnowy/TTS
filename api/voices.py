# Voice ID to Display Name Mapping
VOICES = [
    # Chinese Voices
    {"id": "zh_female_wanwanxiaohe_moon_bigtts", "name": "Isabella (Taiwanese - Vivid)", "lang": "zh", "gender": "Female"},
    {"id": "zh_male_guozhoudege_moon_bigtts", "name": "Andrew (Cantonese - Clear)", "lang": "zh", "gender": "Male"},
    {"id": "zh_female_gaolengyujie_moon_bigtts", "name": "Charlotte (Clear)", "lang": "zh", "gender": "Female"},
    {"id": "zh_female_wanqudashu_moon_bigtts", "name": "Robert (Cantonese - Fun)", "lang": "zh", "gender": "Male"},
    {"id": "zh_male_jingqiangkanye_moon_bigtts", "name": "Thomas (Beijing - Fun)", "lang": "zh", "gender": "Male"},
    {"id": "zh_male_wennuanahu_moon_bigtts", "name": "Mark (Warm)", "lang": "zh", "gender": "Male"},
    {"id": "zh_female_linjianvhai_moon_bigtts", "name": "Lila (Clear)", "lang": "zh", "gender": "Female"},
    {"id": "zh_male_shaonianzixin_moon_bigtts", "name": "Ethan (Clear)", "lang": "zh", "gender": "Male"},
    {"id": "zh_male_yuanboxiaoshu_moon_bigtts", "name": "Joseph (Deep)", "lang": "zh", "gender": "Male"},
    {"id": "zh_female_daimengchuanmei_moon_bigtts", "name": "Elena (Sichuan - Cute)", "lang": "zh", "gender": "Female"},
    {"id": "zh_male_yangguangqingnian_moon_bigtts", "name": "George (Clear)", "lang": "zh", "gender": "Male"},
    {"id": "zh_female_shuangkuaisisi_moon_bigtts", "name": "Aria (Vivid)", "lang": "zh", "gender": "Female"},
    {"id": "zh_male_baqiqingshu_mars_bigtts", "name": "Edward (Audio Book - Deep)", "lang": "zh", "gender": "Male"},
    {"id": "zh_female_wenroushunv_mars_bigtts", "name": "Emma (Audio Book - Soft)", "lang": "zh", "gender": "Female"},
    {"id": "zh_female_shaoergushi_mars_bigtts", "name": "Tina (Dubbing - Vivid)", "lang": "zh", "gender": "Female"},
    {"id": "zh_male_silang_mars_bigtts", "name": "William (Dubbing - Deep)", "lang": "zh", "gender": "Male"},
    {"id": "zh_male_jieshuonansheng_mars_bigtts", "name": "James (Dubbing - Clear)", "lang": "zh", "gender": "Male"},
    {"id": "zh_female_jitangmeimei_mars_bigtts", "name": "Grace (Dubbing - Soft)", "lang": "zh", "gender": "Female"},
    {"id": "zh_female_tiexinnvsheng_mars_bigtts", "name": "Sophia (Dubbing - Warm)", "lang": "zh", "gender": "Female"},
    {"id": "zh_female_qiaopinvsheng_mars_bigtts", "name": "Mia (Dubbing - Vivid)", "lang": "zh", "gender": "Female"},
    {"id": "zh_female_mengyatou_mars_bigtts", "name": "Ava (Dubbing - Vivid)", "lang": "zh", "gender": "Female"},
    {"id": "zh_female_cancan_mars_bigtts", "name": "Luna (General - Clear)", "lang": "zh", "gender": "Female"},
    {"id": "zh_female_qingxinnvsheng_mars_bigtts", "name": "Olivia (General - Clear)", "lang": "zh", "gender": "Female"},
    {"id": "zh_female_linjia_mars_bigtts", "name": "Lily (General - Vivid)", "lang": "zh", "gender": "Female"},

    # English Voices
    {"id": "en_female_anna_mars_bigtts", "name": "Anna (Soft)", "lang": "en", "gender": "Female"},
    {"id": "en_male_adam_mars_bigtts", "name": "Adam (American - Clear)", "lang": "en", "gender": "Male"},
    {"id": "en_female_sarah_mars_bigtts", "name": "Sarah (Australian - Soft)", "lang": "en", "gender": "Female"},
    {"id": "en_male_dryw_mars_bigtts", "name": "Dryw (Australian - Deep)", "lang": "en", "gender": "Male"},
    {"id": "en_male_smith_mars_bigtts", "name": "Smith (British - Deep)", "lang": "en", "gender": "Male"},

    # Japanese Voices
    {"id": "multi_male_jingqiangkanye_moon_bigtts", "name": "Kazune (Fun)", "lang": "ja", "gender": "Male"},
    {"id": "multi_female_shuangkuaisisi_moon_bigtts", "name": "Haruko (Vivid)", "lang": "ja", "gender": "Female"},
    {"id": "multi_female_gaolengyujie_moon_bigtts", "name": "Akemi (Clear)", "lang": "ja", "gender": "Female"},
    {"id": "multi_male_wanqudashu_moon_bigtts", "name": "Hiroshi (Fun)", "lang": "ja", "gender": "Male"},
    
    # Spanish Voices
     {"id": "multi_male_jingqiangkanye_moon_bigtts", "name": "Mateo (Fun)", "lang": "es", "gender": "Male"},
    {"id": "multi_female_shuangkuaisisi_moon_bigtts", "name": "Isabella (Vivid)", "lang": "es", "gender": "Female"},
    {"id": "multi_male_wanqudashu_moon_bigtts", "name": "Alejandro (Fun)", "lang": "es", "gender": "Male"},
]

def get_voice_by_id(voice_id):
    for voice in VOICES:
        if voice["id"] == voice_id:
            return voice
    return None
