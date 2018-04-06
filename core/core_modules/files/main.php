<?php

class files
{
    private const depth = 1;
    static private function filter_($name)
    {
        $name = str_replace("..", "", $name);
        $name = str_replace("/", "", $name);
        $name = str_replace("\\", "", $name);
        return $name;
    }

    static function zip_folder($folder, $zip_name)
    {
        if($folder == null or $zip_name == null)
            error("Не все параметры функции заполнены");
        $folder = static::filter_($folder);
        $zip_name = static::filter_($zip_name);
        $zip_name = str_replace(".zip", "", $zip_name) . ".zip";
        $class_name = get_current_module_name(static::depth);
        $root = getcwd();
        $web_url = "/upload/" . $class_name . "/";
        $uploads_dir = $root . $web_url;
        $for_zip_folder = $uploads_dir . $folder . "/";
        $zipfileName = $uploads_dir . $zip_name;
        $zip = new ZipArchive();

        if($zip->open($zipfileName, ZIPARCHIVE::CREATE | ZipArchive::OVERWRITE) !== true)
            error("Ошибка создания zip архива:" . $zip->status);

        $d_i = new RecursiveDirectoryIterator($for_zip_folder);
        $files = new RecursiveIteratorIterator(
            $d_i,
            RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($files as $name => $file) {
            $folder_path = realpath($for_zip_folder);
            $filePath = $file->getRealPath();
            if(!$file->isDir()) {
                $folder_path .= "/";
                $f_len = strlen($folder_path);
                $relativePath = str_replace("\\", "/", substr($filePath, $f_len));
                if(!$zip->addFile($filePath, $relativePath))
                    error("Ошибка создания zip архива:" . $zip->status);
            }
        }


        //            if(!$zip->addFile($for_zip_folder . $file, iconv('utf-8', 'cp866//IGNORE', $file)))

        if(!$zip->close())
            error("zip->close");

        chmod($zipfileName, 0777);
    }

    static function unzip($zip_filename, $destination)
    {
        if($zip_filename == null or $destination == null)
            error("Не все параметры функции заполнены");
        $destination = static::filter_($destination);
        $zip_filename = static::filter_($zip_filename);
        $class_name = get_current_module_name(static::depth);
        $root = getcwd();
        $web_url = "/upload/" . $class_name . "/";
        $uploads_dir = $root . $web_url;
        $for_unzip_folder = $uploads_dir . $destination;
        if(!is_dir($for_unzip_folder))
            mkdir($for_unzip_folder, 0777);
        $zip_filename = $uploads_dir . "/" . $zip_filename;
        $zip = new ZipArchive;
        if($zip->open($zip_filename) === true) {
            $zip->extractTo($for_unzip_folder);
            $zip->close();
        } else {
            error("error unzip $zip_filename");
        }
    }

    static function save_files_uploaded($name_val, $upl_sub_dir = null, $random_name = false)
    {
        if($_FILES[$name_val]["error"][0] == UPLOAD_ERR_NO_FILE)
            return false;
        if($upl_sub_dir != null)
            $upl_sub_dir = str_replace("..", "", $upl_sub_dir);
        $class_name = get_current_module_name(static::depth);
        $root = getcwd();
        $web_url = "/upload/" . $class_name . "/" . (($upl_sub_dir == null) ? "" : $upl_sub_dir . "/");
        $uploads_dir = $root . $web_url;
        if(!file_exists($uploads_dir))
            mkdir($uploads_dir, 0777, true);

        foreach ($_FILES[$name_val]["error"] as $key => $error) {
            if($error != UPLOAD_ERR_OK)
                error("Ошибка загрузки файла " . $_FILES[$name_val]["tmp_name"][$key]);
            $tmpfilename = $_FILES[$name_val]["tmp_name"][$key];
            $filename = $_FILES[$name_val]["name"][$key];
            if($random_name) {
                $type = "";
                if(($pos = mb_strripos($filename, ".", null, "UTF-8")) !== false)
                    $type = mb_substr($filename, $pos, null, "UTF-8");
                $filename = generate(150) . $type;
                while (file_exists($upl_sub_dir . $filename))
                    $filename = generate(150) . $type;
            }
            if(!move_uploaded_file($tmpfilename, $uploads_dir . $filename))
                error("upload_error");
            chmod($uploads_dir . $filename, 0777);
        }
        return true;
    }

    static function is_file_uploaded($name_val)
    {
        if(!isset($_FILES[$name_val]))
            return false;
        if($_FILES[$name_val]["error"] == 4)
            return false;
        if(is_array($_FILES[$name_val]["error"]) and $_FILES[$name_val]["error"][0] == 4)
            return false;
        return true;
    }

    static function save_file_uploaded($name_val, $sub_dir = null, $random_name = false, $random_upl_sub_dir = false, $save_random_filename_extension = true)
    {
        $upl_sub_dir = $sub_dir;
        if($upl_sub_dir != null)
            $upl_sub_dir = str_replace("..", "", $upl_sub_dir);
        if($random_upl_sub_dir)
            $upl_sub_dir = u_rand_key_generate();
        $class_name = get_current_module_name(static::depth);
        //       if($_FILES[$name_val]["error"] !== 4)
        //           return null;
        if($_FILES[$name_val]["error"] !== 0)
            error("upload_error " . $_FILES[$name_val]["error"]);
        $filename = $_FILES["$name_val"]["name"];
        $tmpfilename = $_FILES["$name_val"]["tmp_name"];
        $root = getcwd();
        $web_url = "/upload/" . $class_name . "/" . (($upl_sub_dir == null) ? "" : $upl_sub_dir . "/");
        $uploads_dir = $root . $web_url;
        if(!file_exists($uploads_dir))
            mkdir($uploads_dir, 0777, true);
        if($random_name) {
            $type = "";
            if(($pos = mb_strripos($filename, ".", null, "UTF-8")) !== false)
                $type = mb_substr($filename, $pos, null, "UTF-8");
            $type = mb_strtolower($type, 'UTF-8');
            if(empty($type)) {
                $file_info = new finfo(FILEINFO_MIME_TYPE);    // object oriented approach!
                $mime_type = $file_info->file($tmpfilename);
                switch ($mime_type) {
                    case "image/jpeg":
                    case "image/jpg":
                        $type = "jpg";
                        break;
                    case "image/png":
                        $type = "png";
                        break;
                }
                if(!empty($type))
                    $type = "." . $type;
            }

            if(!$save_random_filename_extension)
                $type = "";


            $filename = u_rand_key_generate() . $type;
            while (file_exists($upl_sub_dir . $filename))
                $filename = u_rand_key_generate() . $type;
        }
        if(!move_uploaded_file($tmpfilename, $uploads_dir . $filename))
            error("upload_error");
        chmod($uploads_dir . $filename, 0777);
        if(!is_null($upl_sub_dir))
            return array('sub_dir' => $upl_sub_dir, 'file_name' => $filename);
        return $filename;
    }

    static function get_cur_module_upload_path($sub_dir = null)
    {
        $upl_sub_dir = $sub_dir;
        if($upl_sub_dir != null)
            $upl_sub_dir = str_replace("..", "", $upl_sub_dir);

        $class_name = get_current_module_name(static::depth);
        $root = getcwd();
        $web_url = "/upload/" . $class_name . "/" . (($upl_sub_dir == null) ? "" : $upl_sub_dir . "/");
        $uploads_dir = $root . $web_url;
        if(!file_exists($uploads_dir))
            mkdir($uploads_dir, 0777, true);
        return $uploads_dir;
    }

    static function save_to_text_file($filename, $text, $extn = 'txt', $sub_dir = null)
    {
        $upl_sub_dir = $sub_dir;
        if($upl_sub_dir != null)
            $upl_sub_dir = str_replace("..", "", $upl_sub_dir);

        $class_name = get_current_module_name(static::depth);
        $root = getcwd();
        $web_url = "/upload/" . $class_name . "/" . (($upl_sub_dir == null) ? "" : $upl_sub_dir . "/");
        $uploads_dir = $root . $web_url;
        if(!file_exists($uploads_dir))
            mkdir($uploads_dir, 0777, true);
        return save_to_text_file($uploads_dir . $filename, $text, $extn);
    }

    static function open_text_file($filename, $extn = 'txt', $sub_dir = null, $in_upload_dir = true)
    {
        $upl_sub_dir = $sub_dir;
        if($upl_sub_dir != null)
            $upl_sub_dir = str_replace("..", "", $upl_sub_dir);

        $class_name = get_current_module_name(static::depth);
        $root = getcwd();
        $web_url = (!$in_upload_dir ? "/modules/" : "/upload/") . $class_name . "/" . (($upl_sub_dir == null) ? "" : $upl_sub_dir . "/");
        $uploads_dir = $root . $web_url;

        return open_txt_file($uploads_dir . $filename, $extn);
    }

    static function get_web_url($filename, $upl_sub_dir = null, $check_exist = true)
    {
        $filename = str_replace("/", "", $filename);
        $filename = str_replace("\\", "", $filename);
        if($upl_sub_dir != null)
            $upl_sub_dir = str_replace("..", "", $upl_sub_dir);
        $class_name = get_current_module_name(static::depth);
        $web_url = "upload/" . $class_name . "/" . (($upl_sub_dir == null) ? "" : $upl_sub_dir . "/") . $filename;
        if(!$check_exist || file_exists(getcwd() . '/' . $web_url))
            return '/' . $web_url;
        else
            error("file_not_found " . getcwd() . '/' . $web_url);
    }

    static function move_file($filename, $sub_dir = null, $new_sub_dir = null)
    {
        $filename = str_replace("/", "", $filename);
        $filename = str_replace("\\", "", $filename);
        if($sub_dir != null)
            $sub_dir = str_replace("..", "", $sub_dir);
        if($new_sub_dir != null)
            $new_sub_dir = str_replace("..", "", $new_sub_dir);
        $class_name = get_current_module_name(static::depth);
        $path = getcwd() . "/upload/" . $class_name . "/" . (($sub_dir == null) ? "" : $sub_dir . "/");
        $new_path = getcwd() . "/upload/" . $class_name . "/" . (($new_sub_dir == null) ? "" : $new_sub_dir . "/");
        if(!file_exists($new_path) and !mkdir($new_path, 0777, true))
            error("error_move_file");
        if(!rename($path . $filename, $new_path . $filename))
            error("error_move_file");
        chmod($new_path . $filename, 0777);
    }

    static function rename_file($filename, $newfilename, $sub_dir = null)
    {
        $filename = str_replace("/", "", $filename);
        $filename = str_replace("\\", "", $filename);
        $newfilename = str_replace("/", "", $newfilename);
        $newfilename = str_replace("\\", "", $newfilename);
        if($sub_dir != null)
            $sub_dir = str_replace("..", "", $sub_dir);
        $class_name = get_current_module_name(static::depth);
        $path = getcwd() . "/upload/" . $class_name . "/" . (($sub_dir == null) ? "" : $sub_dir . "/");
        if(!rename($path . $filename, $path . $newfilename))
            error("error_rename_file");
        chmod($path . $newfilename, 0777);
        return $newfilename;
    }

    static function copy_file($source, $dest, $sub_dir = null, $new_sub_dir = null, $in_module_dir = true)
    {
        if($in_module_dir) {
            $filename = str_replace("/", "", $source);
            $filename = str_replace("\\", "", $filename);
            $newfilename = str_replace("/", "", $dest);
            $newfilename = str_replace("\\", "", $newfilename);
            if($sub_dir != null)
                $sub_dir = str_replace("..", "", $sub_dir);
            if($new_sub_dir != null)
                $new_sub_dir = str_replace("..", "", $new_sub_dir);
            $class_name = get_current_module_name(static::depth);
            $path = getcwd() . "/upload/" . $class_name . "/" . (($sub_dir == null) ? "" : $sub_dir . "/");
            $new_path = getcwd() . "/upload/" . $class_name . "/" . (($new_sub_dir == null) ? "" : $new_sub_dir . "/");
            if(!file_exists($new_path) and !mkdir($new_path, 0777, true))
                error("error_copy_file");
            $source = $path . $filename;
            $dest = $new_path . $newfilename;
        }
        if(!copy($source, $dest))
            error("error_copy_file");
        chmod($dest, 0777);
        return true;
    }

    static function copy_folder($source, $dest, $in_module_dir = true)
    {
        if($in_module_dir)
            error("in_module_dir = true not support");
        if(is_file($source))
            return static::copy_file($source, $dest, null, null, false);

        if(!is_dir($dest))
            mkdir($dest, 0777);

        $dir = dir($source);
        while (false !== $entry = $dir->read()) {
            if($entry == '.' || $entry == '..')
                continue;
            static::copy_folder("$source/$entry", "$dest/$entry", $in_module_dir);
        }
        $dir->close();
        return true;
    }

    static function create_dir($dir, $absolute_path = false)
    {
        if($absolute_path)
            $path = getcwd() . "/" . $dir;
        else {
            $class_name = get_current_module_name(static::depth);
            $dir = str_replace("..", "", $dir);
            $path = getcwd() . "/upload/" . $class_name . "/" . $dir;
        }
        if(is_dir($path))
            error("directory_already_exists");
        if(!mkdir($path, 0777, true))
            error("error_create_dir");
    }

    static function remove_dir($dir, $absolute_path = false)
    {
        if($absolute_path)
            $path = getcwd() . "/" . $dir;
        else {
            $class_name = get_current_module_name(static::depth);
            $dir = str_replace("..", "", $dir);
            $path = getcwd() . "/upload/" . $class_name . "/" . $dir;
        }
        if(!is_dir($path))
            error("directory_not_found");
        if(!static::rrmdir($path))
            return false;
        return true;
    }

    private static function rrmdir($dir)
    {
        if(is_dir($dir)) {
            $objects = scandir($dir);
            if($objects === false)
                return false;
            foreach ($objects as $object) {
                if($object != "." && $object != "..") {
                    try {
                        if(filetype($dir . "/" . $object) == "dir") static::rrmdir($dir . "/" . $object);
                        elseif(!@unlink($dir . "/" . $object))
                            return false;
                    } catch (Throwable | Exception $e) {
                        return false;
                    }
                }
            }
            reset($objects);
            if(!@rmdir($dir))
                return false;
        }
        return true;
    }

    static function exist($filename = null, $sub_dir = null)
    {
        if($filename == null and $sub_dir == null)
            error("error exist filename==null and sub_dir==null");
        if($filename != null) {
            $filename = str_replace("/", "", $filename);
            $filename = str_replace("\\", "", $filename);
        }
        if($sub_dir != null)
            $sub_dir = str_replace("..", "", $sub_dir);
        $class_name = get_current_module_name(static::depth);
        $path = getcwd() . "/upload/" . $class_name . "/" . (($sub_dir == null) ? "" : $sub_dir . "/");
        if($filename == null)
            return is_dir($path);
        else
            return file_exists($path . $filename);
    }

    static function is_dir_empty($dir, $absolute_path = false)
    {
        if($absolute_path)
            $path = getcwd() . "/" . $dir;
        else {
            $class_name = get_current_module_name(static::depth);
            $dir = str_replace("..", "", $dir);
            $path = getcwd() . "/upload/" . $class_name . "/" . $dir;
        }

        if(!is_readable($path)) return null;
        $handle = opendir($path);
        while (false !== ($entry = readdir($handle))) {
            if($entry != "." && $entry != "..") {
                return false;
            }
        }
        closedir($handle);
        return true;
    }

    static function remove_file($filename, $sub_dir = null)
    {
        $filename = str_replace("/", "", $filename);
        $filename = str_replace("\\", "", $filename);
        if($sub_dir != null)
            $sub_dir = str_replace("..", "", $sub_dir);
        $class_name = get_current_module_name(static::depth);
        $path = getcwd() . "/upload/" . $class_name . "/" . (($sub_dir == null) ? "" : $sub_dir . "/");
        if(!unlink($path . $filename))
            error("error_remove_file");
    }

    static function get_list($sub_dir = null, $sub_dirs_only = false, $files_only = false, $limit = null)
    {
        if($sub_dir != null)
            $sub_dir = str_replace("..", "", $sub_dir);
        $list = array();
        $class_name = get_current_module_name(static::depth);
        $path = getcwd() . "/upload/" . $class_name . (($sub_dir == null) ? "" : "/" . $sub_dir);
        if(!is_dir($path))
            error("dir_not_found");
        if(!($handle = opendir($path)))
            error("error_open_dir");
        $i = 0;
        while (false !== ($entry = readdir($handle))) {
            if($limit != null and $limit >= $i)
                break;
            $encod = mb_detect_encoding($entry);
            if($encod === false)
                $entry = iconv("windows-1251", "UTF-8", $entry);
            if($entry != "." && $entry != "..") {
                if($sub_dirs_only) {
                    if(is_dir($path . "/" . $entry))
                        $list[$i] = $entry;
                    $i++;
                } elseif($files_only) {
                    if(!is_dir($path . "/" . $entry))
                        $list[$i] = $entry;
                    $i++;
                } else {
                    $list[$i] = $entry;
                    $i++;
                }
            }
        }
        closedir($handle);
        return $list;
    }

} 