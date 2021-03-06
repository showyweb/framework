<?php

class error_notifier_api
{
    function check()
    {
        global $root;
        $save_cur_line = 0;
        $save_file_time = 0;
        $error_notifier_path = $root . "/error_notifier.txt";
        if(file_exists($error_notifier_path)) {
            $error_notifier_tmp = unserialize(open_txt_file($error_notifier_path, null));
            $save_cur_line = $error_notifier_tmp['save_cur_line'];
            $save_file_time = $error_notifier_tmp['save_file_time'];
        }
        $file_path = get_settings('log_path');
        $report_emails = get_settings('report_emails');
        if(!@file_exists($file_path)) {
            $err_mes = "Файл " . $file_path . " не найден";
            if(send_html_email($report_emails, "Обнаружена ошибка на сайте " . $_SERVER['SERVER_NAME'], $err_mes) != "ok")
                return "Ошибка отправки отчета об ошибках";
            return $err_mes;
        }

        if($save_file_time == filemtime($file_path))
            return "Ошибок нет";

        $log_text = file($file_path);
        $lines_size = count($log_text);
        if($lines_size - 1 < $save_cur_line)
            $save_cur_line = 0;
        $err_mes = '<html><body>';
        $i = 0;
        $error_found = false;
        $ignore_pattern = get_settings('ignore_pattern');
        for ($i = $save_cur_line; $i < $lines_size; $i++) {
            if(preg_match($ignore_pattern, $log_text[$i]) == 0) {
                $error_found = true;
                $err_mes .= "<p>" . $log_text[$i] . "</p>";
            }
        }
        $err_mes .= '</body></html>';
        $save_cur_line = $i;
        $save_file_time = filemtime($file_path);
        $error_notifier_tmp['save_cur_line'] = $save_cur_line;
        $error_notifier_tmp['save_file_time'] = $save_file_time;
        if($error_found) {
            if(send_html_email($report_emails, "Обнаружена ошибка на сайте " . $_SERVER['SERVER_NAME'], $err_mes) != "ok")
                return "Ошибка отправки отчета об ошибках";
        } else {
            save_to_text_file($error_notifier_path, serialize($error_notifier_tmp), null);
            return "Ошибок нет";
        }
        save_to_text_file($error_notifier_path, serialize($error_notifier_tmp), null);
        return "Отчет об ошибках отправлен";
    }
}