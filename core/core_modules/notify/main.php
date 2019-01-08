<?php


class notify_db_c extends qdbm\schema
{
    public $tab_name = "notify";
    const title = array('type' => qdbm\type_column::small_string, 'is_xss_filter' => true, 'is_add_index' => false);
    const href = array('type' => qdbm\type_column::string, 'is_xss_filter' => false, 'is_add_index' => false);
    const href_but_name = array('type' => qdbm\type_column::small_string, 'is_xss_filter' => true, 'is_add_index' => false);
    const tag = array('type' => qdbm\type_column::small_string, 'is_xss_filter' => true, 'is_add_index' => true);
}

class notify
{

    private $db = null;
    public $db_s = null;

    static function main()
    {
        new static();
    }

    public function __construct()
    {
        $this->db_s = new notify_db_c();
        $this->db = new qdbm\db($this->db_s);
        return $this;
    }

    /**
     * @param $title
     * @param string $href Этот параметр поддерживает следующие макросы: {new_id} - идентификатор уведомления.
     * @param string $href_but_name
     * @param null $custom_html_mes
     * @param bool|false $not_save_notify
     * @return int
     */
    function push($title, $href, $href_but_name = "Посмотреть", $custom_html_mes = null, $custom_sms_mes = null, $not_save_notify = false, $tag = "default")
    {
        $authorization = new authorization_api();
        $arr = $authorization->get_user("root", authorization_api::$roles['admin']);
        $email = $arr['email'];
        $phone = characters_unescape($arr['phone']);
        $api_id = $arr['sms_ru_api_id'];
        $sip_id = $arr['sipnet_ru_id'];
        $sip_password = $arr['sipnet_ru_password'];
        $call_hs = $arr['call_hour_start'];
        $call_he = $arr['call_hour_end'];
        $db = $this->db;
        $new_id = $db->get_nii();
        $href = preg_replace(array("/{new_id}/ui"), array($new_id), $href);
        if(!$not_save_notify) {
            $rec = [
                'title' => $title,
                'href' => $href,
                'href_but_name' => $href_but_name,
                'tag' => $tag
            ];
            $db->insert($rec, $new_id);
        }
        $subject = 'Новое уведомление на сайте ' . get_http_host_name();
        $html_mes = '<html><body><p>' . $title . '</p><p>Для просмотра зайдите на сайт <a href="http://' . get_http_host_name() . '/#login">' . get_http_host_name() . '</a> и авторизуйтесь</p></body></html>';
        if(!is_null($custom_html_mes))
            $html_mes = $custom_html_mes;
        if($email != "")
            send_html_email($email, $subject, $html_mes);
        if($phone != "") {
            $sms_mes = $subject;
            if(!is_null($custom_sms_mes))
                $sms_mes = $custom_sms_mes;
            sms::send($phone, $sms_mes, $api_id);
        }

        if($phone and $sip_id and $sip_password)
            static::create_call_job("Здравствуйте! $title", $sip_id, $sip_password, $phone, $call_hs, $call_he);

        $db->unlock_tables();
        if($not_save_notify)
            return 0;
        return $new_id;
    }

    function get()
    {
        $db = $this->db;
        $res = $db->get_rows(new qdbm\select_q(['order_method' => qdbm\order::desc]));
        return $res;
    }

    function remove($id)
    {
        $id = intval($id);
        $db = $this->db;
        $db->remove_rows((new qdbm\where())->equally('id', $id));
    }

    function remove_by_tag($tag)
    {
        $db = $this->db;
        $db->remove_rows((new qdbm\where())->equally('tag', $tag));

    }

    static function create_call_job($text, $sip_id, $sip_password, $phone, $allow_hour_start = null, $allow_hour_end = null)
    {
        global $root;
        $save_path = '/home/AutoCall/jobs/';
        $tmp_path = "/tmp/";
        if(!is_dir($save_path)) {
            if(is_os_windows()) {
                $save_path = $root . "/tmp/";
                if(!is_dir($save_path))
                    mkdir($save_path);
                $tmp_path = $save_path;
            } else
                error("save_path $save_path not found");

        }
        $timestamp = time();

        $wav_file_name = $sip_id . "_" . $sip_password . "_" . str_replace('+', '', $phone) . "_" . $timestamp;

        if(!empty($allow_hour_start) and !empty($allow_hour_end)) {
            $cur_hour = intval(date('G', $timestamp));
            if(($allow_hour_start < $allow_hour_end and ($cur_hour < $allow_hour_start or $cur_hour > $allow_hour_end)) or ($allow_hour_start > $allow_hour_end and $cur_hour < $allow_hour_start and $cur_hour > $allow_hour_end)) {
                $minute_start = 0;
                while (true) {
                    $timestamp = mktime($allow_hour_start, $minute_start, 0);
                    if($allow_hour_start < $allow_hour_end and $cur_hour > $allow_hour_end) {
                        $dt = new DateTime();
                        $dt->setTimestamp($timestamp);
                        $dt->add(new DateInterval("P1D"));
                        $timestamp = $dt->getTimestamp();
                    }
                    $wav_file_name = $sip_id . "_" . $sip_password . "_" . str_replace('+', '', $phone) . "_" . $timestamp;
                    if(file_exists($save_path . $wav_file_name . ".wav"))
                        $minute_start++;
                    else
                        break;
                }
            }
        }

        try {
            $clientSecret = get_settings('microsofttranslator_client_secret');
            //Create the AccessTokenAuthentication object.
            $authObj = new AccessTokenAuthentication();
            //Get the Access token.
            $accessToken = $authObj->getToken($clientSecret);
            //Create the authorization Header string.
            $authHeader = "Authorization: Bearer " . $accessToken;
            //Set the params.
            $inputStr = urlencode($text);
            $language = 'ru';
            $params = "text=$inputStr&language=$language&format=audio/wav&options=MaxQuality";
            //HTTP Speak method URL.
            $url = "https://api.microsofttranslator.com/V2/Http.svc/Speak?$params";

            //Create the Translator Object.
            $translatorObj = new HTTPTranslator();

            //Call the curlRequest.
            $strResponse = $translatorObj->curlRequest($url, $authHeader);

            save_to_text_file($tmp_path . $wav_file_name . ".wav", $strResponse, null);
            if(!is_os_windows()) {
                $wav_file = $tmp_path . $wav_file_name . ".wav";
                $s_wav_file = $save_path . $wav_file_name . ".wav";
                exec("ffmpeg -i '$wav_file' -f wav -flags bitexact -acodec pcm_s16le -ar 16000 -ac 1 '$s_wav_file'");
                chmod($s_wav_file, 0777);
            }
        } catch (Throwable $e) {
            echo "Exception: " . $e->getMessage() . PHP_EOL;
        }
    }
}

class AccessTokenAuthentication
{
    /*
     * Get the access token.
     *
     * @param string $azure_key    Subscription key for Text Translation API.
     *
     * @return string.
     */
    function getToken($azure_key)
    {
        $url = 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken';
        $ch = curl_init();
        $data_string = json_encode('{body}');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Content-Type: application/json',
                'Content-Length: ' . strlen($data_string),
                'Ocp-Apim-Subscription-Key: ' . $azure_key
            )
        );
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $strResponse = curl_exec($ch);
        if(curl_exec($ch) === false) {
            echo 'Ошибка curl: ' . curl_error($ch);
        }
        curl_close($ch);
        return $strResponse;
    }
}

Class HTTPTranslator
{
    /*
     * Create and execute the HTTP CURL request.
     *
     * @param string $url        HTTP Url.
     * @param string $authHeader Authorization Header string.
     *
     * @return string.
     *
     */
    function curlRequest($url, $authHeader)
    {
        //Initialize the Curl Session.
        $ch = curl_init();
        //Set the Curl url.
        curl_setopt($ch, CURLOPT_URL, $url);
        //Set the HTTP HEADER Fields.
        curl_setopt($ch, CURLOPT_HTTPHEADER, array($authHeader));
        //CURLOPT_RETURNTRANSFER- TRUE to return the transfer as a string of the return value of curl_exec().
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        //CURLOPT_SSL_VERIFYPEER- Set FALSE to stop cURL from verifying the peer's certificate.
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        //Execute the  cURL session.
        $curlResponse = curl_exec($ch);
        //Get the Error Code returned by Curl.
        $curlErrno = curl_errno($ch);
        if($curlErrno) {
            $curlError = curl_error($ch);
            throw new Exception($curlError);
        }
        //Close a cURL session.
        curl_close($ch);
        return $curlResponse;
    }
}