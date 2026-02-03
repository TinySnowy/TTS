<span id="MHovHG9e"></span>
# Interface Function
The unidirectional streaming API provides text\-to\-speech capabilities, supports multiple languages and dialects, and offers streaming output over HTTP.
<span id="Qsu1IEmV"></span>
## Best Practices

* The client reads the JSON data returned by the server in a streaming manner and extracts the corresponding audio from it. 
* The returned audio is in base64 format, which needs to be parsed and concatenated into a byte array to assemble the audio for playback. 
* You can use connection\-reuse components in the corresponding programming language to avoid repeatedly creating TCP connections (the Byteplus server’s keep\-alive time is 1 minute), such as Python’s `session` component:

```JSON
session = requests.Session()
response = session.post(url, headers=headers, json=payload, stream=True)
```

<span id="Kh7YMhd3"></span>
# Interface Description
<span id="wNitEmSP"></span>
## Request
<span id="tJqx5XDv"></span>
#### Request Path
The request path is: `https://voice.ap-southeast-1.bytepluses.com/api/v3/tts/unidirectional`
<span id="vdDeXveF"></span>
#### Request Headers

|<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
|Key</div>|Description</div>|Required</div>|Value Example</div>|\
| | | | |
|---|---|---|---|
|X\-Api\-App\-Id |The **APP ID** obtained from BytePlus console. For reference, see [Console Guidance](https://docs.byteplus.com/en/docs/byteplusvoice/Speech_Console_Guide) |<div style="text-align: center">|123456789 |\
| | |Yes</div>| |\
| | | | |
|X\-Api\-Access\-Key |The **Access Token ** obtained from BytePlus console. For reference, see [Console Guidance](https://docs.byteplus.com/en/docs/byteplusvoice/Speech_Console_Guide) |<div style="text-align: center">|your\-access\-key |\
| | |Yes</div>| |\
| | | | |
|&nbsp;|Indicates the resource information ID for calling the service:|<div style="text-align: center">|TTS: volc.service_type.1000009|\
|X\-Api\-Resource\-Id |**TTS:**  volc.service_type.1000009|Yes</div>|Voice Replication: volc.megatts.default |\
| |**Voice Replication:**  volc.megatts.default | | |
|X\-Api\-App\-Key |Fixed value |<div style="text-align: center">|aGjiRDfUWi |\
| | |Yes</div>| |\
| | | | |
|X\-Api\-Request\-Id |Identifies the client request ID, a UUID random string |<div style="text-align: center">|67ee89ba\-7050\-4c04\-a3d7\-ac61a63499b3 |\
| | |No</div>| |\
| | | | |

<span id="8Z6MY083"></span>
#### Response Headers

|<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
|Key</div>|Description</div>|Value Example</div>|\
| | | |
|---|---|---|
|X\-Tt\-Logid |The logid returned by the server. It is recommended that users obtain and print it for troubleshooting purpose. |2025041513355271DF5CF1A0AE0508E78C |

<span id="EZ5JOriE"></span>
## Request Body

|<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
|Field</div>|Description</div>|Required</div>|Type</div>|Default Value</div>|\
| | | | | |
|---|---|---|---|---|
|user |User information |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| | |No</div>|object</div>|——</div>|\
| | | | | |
|user.id |User uid |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| | |No</div>|string</div>|——</div>|\
| | | | | |
|req_params.text |Input text (SSML is not currently supported for unidirectional streaming) |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| | |Yes</div>|string</div>|——</div>|\
| | | | | |
|req_params.model|For the model version, if `seed-tts-1.1` is transmitted, the sound quality will be improved compared with the default version, and the delay will be better; if not transmitted, the default effect will apply. |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| | |No</div>|string</div>|——</div>|\
| | | | | |
|req_params.speaker |Speaker. For details, see the [Voice List](https://docs.byteplus.com/en/docs/byteplusvoice/voicelist) |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| | |Yes</div>|string</div>|——</div>|\
| | | | | |
|req_params.audio_params |Audio parameters, used to reduce server\-side audio decoding time |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| | |Yes</div>|object</div>|——</div>|\
| | | | | |
|req_params.audio_params.format |Audio encoding format:` mp3/ogg_opus/pcm`|<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| |:::tip Note|No</div>|string</div>|mp3</div>|\
| |Passing WAV to the API will not cause an error, but in streaming scenarios it will return multiple WAV headers. PCM is recommended in such cases.| | | |\
| || | | |\
| |:::| | | |
|req_params.audio_params.sample_rate |Audio sampling rate. Optional values: `[8000, 16000, 22050, 24000, 32000, 44100, 48000]` |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| | |No</div>|number</div>|24000</div>|\
| | | | | |
|req_params.audio_params.bit_rate |The audio bit\-rate can be set to values such as 16000, 32000, etc.|<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| |The default range is 64k~160k, it's a must to pass parameter `disable_default_bit_rate` as `true`|No</div>|number</div>|——</div>|\
| | if you want to set the rate lower than 64k.| | | |\
| |Golang sample: `additions = fmt.Sprintf({"disable\_default\_bit\_rate":true}")`| | | |\
| |:::tip Note| | | |\
| |For MP3 and OGG formats, it is recommended to manually set the `bit_rate`. Using the default value (8k) may cause significant audio quality loss. For WAV files, the bitrate is calculated the same way as PCM:| | | |\
| |**bitrate (bps) = sample rate × bit depth × number of channels**| | | |\
| |Currently, the large TTS model can only modify the sample rate, so for WAV format, the bitrate can only be changed by adjusting the sample rate.| | | |\
| || | | |\
| |:::| | | |
|req_params.audio_params.emotion |Set the emotion of the timbre. Example: `"emotion": "angry"`|<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| |:::tip Note|No</div>|string</div>|——</div>|\
| |Note: Currently, only some timbres support setting emotions, and different timbres support different ranges of emotions. For details, see [Voice List](https://docs.byteplus.com/en/docs/byteplusvoice/voicelist)| | | |\
| || | | |\
| |:::| | | |
|req_params.audio_params.emotion_scale |After calling the emotion to set the emotion parameters, you can use emotion_scale to further set the emotion value, which ranges from 1 to 5. If not set, the default value is 4. |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| |:::tip Note|No</div>|number</div>|4</div>|\
| |Theoretically, the larger the emotion value, the more obvious the emotion. However, the actual emotion values from 1 to 5 are non\-linearly increasing, and the emotion may not increase significantly after exceeding a certain value. For example, the emotion values set to 3 and 5 may be close.| | | |\
| || | | |\
| |:::| | | |
|req_params.audio_params.speech_rate |Speech rate. The value range is [\-50, 100]. 100 represents 2.0x speed, and \-50 represents 0.5x speed. |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| | |No</div>|number</div>|0</div>|\
| | | | | |
|req_params.audio_params.loudness_rate |Volume. The value range is [\-50, 100]. 100 represents 2.0x volume, and \-50 represents 0.5x volume. |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| | |No</div>|number</div>|0</div>|\
| | | | | |
|req_params.audio_params.enable_timestamp |Whether to choose to return word and phoneme timestamps at the same time |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| | |No</div>|bool</div>|FALSE</div>|\
| | | | | |
|req_params.additions |User\-defined parameters |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| | |Yes</div>|jsonstring</div>|——</div>|\
| | | | | |
|req_params.additions.post_process.pitch |It needs to be passed in additions and set in post_process. The pitch range is [\-12, 12]. |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| |Golang sample:`additions = fmt.Sprintf("{"post_process":{"pitch":12}}")`|No</div>|number</div>|0</div>|\
| |Note: If the pitch is the default 0, adjusting the speech_rate will not take effect; If the pitch is not the default 0, then the pitch can take effect, and at this time, the speech_rate can also take effect. | | | |
|req_params.additions.silence_duration |Setting this parameter can add a mute duration at the end of the sentence, ranging from 0 to 30000ms. |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| |:::tip Note|No</div>|number</div>|0</div>|\
| |The added mute at the end of the sentence is mainly for the end of the last sentence in the input text, not the end of each sentence.| | | |\
| || | | |\
| |:::| | | |

<span id="XbpwHn6h"></span>
#### Additions Structure Definition

|<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
|Field</div>|Description</div>|Required</div>|Type</div>|Default Value</div>|\
| | | | | |
|---|---|---|---|---|
|enable_language_detector |Automatically identify the language |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| | |No</div>|bool</div>|FALSE</div>|\
| | | | | |
|disable_markdown_filter |Whether to enable markdown parsing and filtering. |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| |When it is true, parse and filter markdown syntax. For example, Hello will be read as "Hello". |No</div>|bool</div>|FALSE</div>|\
| |When it is false, do not parse or filter. For example, Hello will be read as "star 'Hello' star". | | | |
|enable_latex_tn |Whether to broadcast LaTeX formulas. disable_markdown_filter needs to be set to true. |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| | |No</div>|bool</div>|FALSE</div>|\
| | | | | |
|max_length_to_filter_parenthesis |Whether to filter the part in parentheses. 0 means not to filter, and 100 means to filter. |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| | |No</div>|int</div>|100</div>|\
| | | | | |
|explicit_language |When applying to TTS 1.0:|<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| ||No</div>|string</div>|——</div>|\
| |* If not given, then English\-Chinese mix| | | |\
| |* `crosslingual`: enables multilingual frontend (including | | | |\
| || | | |\
| |`zh/en/ja/es-mx/id/pt-br`)| | | |\
| || | | |\
| |* `zh`: Chinese, support Chinese & English mix| | | |\
| |* `en`: English only| | | |\
| |* `ja`: Japanese only| | | |\
| |* `es-mx`: Mexican Spanish only| | | |\
| |* `id`: Indonesian Bahasa only| | | |\
| |* `pt-br`: Brazalian Portuguese only| | | |\
| || | | |\
| |&nbsp;| | | |\
| |When applying to Voice Replication `model_type=2`:| | | |\
| || | | |\
| |* If not given, then multilingual frontend (including | | | |\
| |* `zh/en/ja/es-mx/id/pt-br`)| | | |\
| |* `crosslingual`: enables multilingual front \- end (including | | | |\
| || | | |\
| |`zh/en/ja/es-mx/id/pt-br`)| | | |\
| || | | |\
| |* `zh`: Chinese, support Chinese & English mix| | | |\
| |* `en`: English only| | | |\
| |* `ja`: Japanese only| | | |\
| |* `es-mx`: Mexican Spanish only| | | |\
| |* `id`: Indonesian Bahasa only| | | |\
| |* `pt-br`: Brazalian Portuguese only| | | |\
| |* `de`: German only| | | |\
| |* `fr`: French only| | | |\
| || | | |\
| |&nbsp;| | | |\
| |When applying to Voice Replication `model_type=3`:| | | |\
| |this parameter must be explicitly passed in the request. | | | |\
| || | | |\
| |* `zh`: Chinese, support Chinese & English mix| | | |\
| |* `en`: English only| | | |\
| || | | |\
| |&nbsp;| | | |\
| |Sample (go): `additions = fmt.Sprintf("{"explicit_language": "zh"}")` | | | |
|context_language |Provide reference language for the model|<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| ||No</div>|string</div>|——</div>|\
| |* If not given, Western European languages use English. | | | |\
| |* `id`: Western European languages use Indonesian. | | | |\
| |* `es`: Western European languages use Mexican Spanish. | | | |\
| |* `pt`: Western European languages use Brazilian Portuguese. | | | |
|cache_config |Enable Caching|<div style="text-align: center">| | |\
| |When caching is enabled, the service will directly read the cache and return the audio synthesized for the same text in the previous synthesis when synthesizing identical text. This can significantly accelerate the synthesis speed for the same text. The cached data is retained for 1 hour.|No</div>| | |\
| |:::tip Note| | | |\
| |Data returned via the cache will not include timestamps.| | | |\
| |:::| | | |\
| |Golang sample: `additions := fmt.Sprintf("{\"disable_default_bit_rate\":true, \"cache_config\": {\"text_type\": 1,\"use_cache\": true}}")` | | | |
|cache_config.text_type |When used together with the `use_cache` parameter, set it to `1 `when enabling caching. |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| | |No</div>|int</div>|1</div>|\
| | | | | |
|cache_config.use_cache |When used in conjunction with the `text_type` parameter, set `use_cache` to `true` when enabling caching. |<div style="text-align: center">|<div style="text-align: center">|<div style="text-align: center">|\
| | |No</div>|bool</div>|TRUE</div>|\
| | | | | |

<span id="465VwMhY"></span>
#### Example JSON
plaintext
```Plain Text
{
    "req_params": {
        "text": "Welcome to use ByteDance text-to-speech services",
        "speaker": "zh_female_gaolengyujie_moon_bigtts",
        "additions": "{\"disable_markdown_filter\":true,\"enable_language_detector\":true,\"enable_latex_tn\":true,\"disable_default_bit_rate\":true,\"max_length_to_filter_parenthesis\":0,\"cache_config\":{\"text_type\":1,\"use_cache\":true}}",
        "audio_params": {
            "format": "mp3",
            "sample_rate": 24000
        }
    }
}
```

<span id="7GevX2tU"></span>
## Response
Audio response data, where data corresponds to the synthesized base64 audio:
```Plain Text
{
    "code": 0,
    "message": "",
    "data" : {{STRING}}
}
```

Successful response corresponding to the end of audio synthesis:
```Plain Text
{
    "code": 20000000,
    "message": "ok",
    "data": null
}
```

<span id="nYfG0rlD"></span>
## Error Code

|Code |Message |Description |
|---|---|---|
|20000000 |ok |Success status code for the end of audio synthesis |
|40402003 |TTSExceededTextLimit: exceed max limit |The submitted text length exceeds the limit |
|&nbsp;|speaker permission denied: get resource id: access denied |Speaker authentication failed, usually because the speaker specified timbre is not authorized or is incorrect |\
|45000000 | | |
|^^|quota exceeded for types: concurrency |Concurrency limit, usually because the number of concurrent requests exceeds the limit |
|55000000 |Some server errors |General server error |

<span id="h5DX67XD"></span>
## Samples

```mixin-react
return (<Tabs>
<Tabs.TabPane title="Python Example" key="INBikAEla6"><RenderMd content={`<span id="Q2hzvrJw"></span>
### Precondition

* Before invoking, you need to obtain the following information:
   * \`<appid>\`: APP ID obtained using the console.
   * \`<access_token>\`: Access Token obtained using the console.
   * \`<voice_type>\`: The timbre ID you expect to use.

<span id="Q2hzvrJw"></span>
### Python env

* Python：Version 3.9 and above.
* Pip：Version 25.1.1 and above. You can use the following command to install it.

\`\`\`Bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip
pip3 install requests 
\`\`\`

<span id="Q2hzvrJw"></span>
### Download code example
<Attachment link="https://sf16-resources.bytepluscdn.com/obj/byteplus-public-aiso/cloud-universal-doc/upload_80bb4a4c21d344c6ab540dc656e5cd1a.zip" name="tts_http_demo.py.zip"></Attachment>
<span id="fkByj2PB"></span>
### Invoke
> \`appID\`: Replace with your APP ID.
> \`accessKey\`: Replace with your Access Token.
> \`speaker\`: Replace with your timbre ID, eg.\`zh_female_cancan_mars_bigtts\`.

\`\`\`Bash
python3 tts_http_demo.py
\`\`\`

`}></RenderMd></Tabs.TabPane></Tabs>);
```

&nbsp;
&nbsp;


