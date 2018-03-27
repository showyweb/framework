<?php

abstract class JPEG_QUALITY
{
    const HIGHEST = 100;
    const HIGH = 85;
    const MEDIUM = 50;
    const LOW = 0;
}

class img
{

    /**
     * Возвращает размер изображения в виде объекта со свойствами width и height
     * @param string $web_url
     * @return object
     *
     */
    static function get_size($web_url)
    {
        $filename = "/" . $web_url;
        $filename = getcwd() . $filename;
        $filename = str_replace('//', '/', $filename);
        list($width, $height) = getimagesize($filename);
        return (object)array('width' => $width, 'height' => $height);
    }

    static function get_img_type($web_url)
    {
        $filename = "/" . $web_url;
        $filename = getcwd() . $filename;
        $filename = str_replace('//', '/', $filename);
        $imgInfo = getimagesize($filename);
        if($imgInfo[0] == 0 or $imgInfo[1] == 0)
            error('Вы пытаетесь обработать не поддерживаемый формат файла, загрузить возможно только изображения в формате jpg, jpeg и png…');
        return $imgInfo[2];

    }

    private static $path_cache_ = ".cache";

    /**
     * @param $size
     * @param $web_url
     * @param null $domain
     * @param null $end_type
     * @param int $jpeg_quality
     * @param bool|false $revert_size_coefficient Высота или ширина будет не меньше $size
     * @return bool
     * @throws exception
     */
    static function compressing_img($size, $web_url, $domain = null, $end_type = null, $jpeg_quality = JPEG_QUALITY::HIGHEST, $revert_size_coefficient = false)
    {
        global $root;
        $global_img_compress_lock = get_settings('global_img_compress_lock', 'global');
        $path_cache = $root . static::$path_cache_;
        if(!is_os_windows() and $global_img_compress_lock)
            $path_cache = "/home";
        $ip = get_client_ip();

        $ip = '127.0.0.1';

        $ip_filter_file = $path_cache . '/active_ip_' . $ip;
        while (file_exists($ip_filter_file)) {
            if(date("i") != date("i", filemtime($ip_filter_file))) {
                unlink($ip_filter_file);
                break;
            } else {
                sleep(1);
            }
        }
        try {
            save_to_text_file($ip_filter_file, '', null);
        } catch (Throwable | Exception $e) {

        }
        $filename = null;
        try {
            if(is_null($size)) $size = 3840;
            $font_path = getcwd() . "/th/arialbd.ttf";
            $filename = "/" . $web_url;
            $filename = getcwd() . $filename;
            $filename = str_replace('//', '/', $filename);
            $imgInfo = getimagesize($filename);
            list($width, $height) = $imgInfo;
            $max_image_size = 10000;
            if($width > $max_image_size or $height > $max_image_size) {
                unlink($filename);
                error('Невозможно обработать изображение, так как высота или ширина больше чем ' . $max_image_size . ' пикселей, слишком большие изображения нельзя обработать на сервере из-за ограничения оперативной памяти хостингом');
            }

            if($imgInfo[0] == 0 or $imgInfo[1] == 0)
                error('Вы пытаетесь обработать не поддерживаемый формат файла, загрузить возможно только изображения в формате jpg, jpeg и png…');
            $max_php_image_size = 3840;
            if($width > $max_php_image_size or $height > $max_php_image_size) {
                $exec_command = (is_os_windows() ? "magick " : "") . "convert -limit memory 10MB -limit map 10MB -limit area 10MB \"$filename\" -scale $max_php_image_size -quality 100 \"$filename\"";
                exec($exec_command, $output, $return_var);
                if($return_var != 0)
                    error("Ошибка сжатия файла $filename с помощью imagemagick");
                $imgInfo = getimagesize($filename);
                list($width, $height) = $imgInfo;
            }
            $exif = null;
            try {
                $exif = @read_exif_data($filename);
            } catch (Throwable | Exception $ex) {

            }

            $coefficient = $size;
            if(($width > $coefficient or $height > $coefficient) and $coefficient != 0) {
                if($revert_size_coefficient) {
                    if($width < $height) {
                        $w_ = $width / $coefficient;
                        $w = $width / $w_;
                        $h = $height / $w_;
                    } else {
                        $h_ = $height / $coefficient;
                        $w = $width / $h_;
                        $h = $height / $h_;
                    };
                } else {
                    if($width >= $height) {
                        $w_ = $width / $coefficient;
                        $w = $width / $w_;
                        $h = $height / $w_;
                    } else {
                        $h_ = $height / $coefficient;
                        $w = $width / $h_;
                        $h = $height / $h_;
                    };
                }
                $newwidth_2 = $w;
                $newheight_2 = $h;
                $original_compressing = false;

                $img = imagecreatetruecolor($newwidth_2, $newheight_2);
            } else {
                $newwidth_2 = $imgInfo[0];
                $newheight_2 = $imgInfo[1];
                $original_compressing = true;
                $img = imagecreatetruecolor($imgInfo[0], $imgInfo[1]);
            };
            imagesetinterpolation($img, IMG_BICUBIC_FIXED);
            $source = null;
            switch ($imgInfo[2]) {
                case IMAGETYPE_JPEG:
                    if(!($source = imagecreatefromjpeg($filename)))
                        error("Ошибка обработки изображения!");
                    break;

                case IMAGETYPE_PNG:
                    if(!($source = imagecreatefrompng($filename)))
                        error("Ошибка обработки изображения!");
                    break;
                default:
                    error("Ошибка обработки изображения!");
                    break;
            }
            imagesetinterpolation($source, IMG_BICUBIC_FIXED);
            $end_type = is_null($end_type) ? $imgInfo[2] : $end_type;

            if($domain !== null) {
                switch ($end_type) {
                    case IMAGETYPE_JPEG:
                        if(isset($exif['Orientation'])) {
                            if($exif['Orientation'] == 3) $source = imagerotate($source, 180, 0);
                            elseif($exif['Orientation'] == 6) $source = imagerotate($source, 270, 0);
                            elseif($exif['Orientation'] == 8) $source = imagerotate($source, 90, 0);
                            if($exif['Orientation'] == 6 || $exif['Orientation'] == 8) {
                                $temp = $imgInfo[0];
                                $imgInfo[0] = $imgInfo[1];
                                $imgInfo[1] = $temp;
                                $tmp = $width;
                                $width = $height;
                                $height = $tmp;
                                $tmp = $newwidth_2;
                                $newwidth_2 = $newheight_2;
                                $newheight_2 = $tmp;
                            }
                            $img = imagecreatetruecolor($newwidth_2, $newheight_2);
                            imagesetinterpolation($img, IMG_BICUBIC_FIXED);
                        }
                        $im = static::create_watermark($source, $domain, $font_path, 255, 0, 0, 100);
                        if(!$original_compressing) {
                            $im_temp = $im;
                            if(!imagecopyresampled($img, $im_temp, 0, 0, 0, 0, $newwidth_2, $newheight_2, $width, $height)) error("Ошибка обработки изображения!");
                            imagejpeg($img, $filename, $jpeg_quality);
                        } else {
                            imagejpeg($im, $filename, $jpeg_quality);
                        }
                        break;

                    case IMAGETYPE_PNG:
                        imagealphablending($img, false);
                        imagesavealpha($img, true);
                        $transparent = imagecolorallocatealpha($img, 255, 255, 255, 127);
                        imagefilledrectangle($img, 0, 0, $imgInfo[0], $imgInfo[1], $transparent);
                        $im = static::create_watermark($source, $domain, $font_path, 255, 0, 0, 100);
                        if(!$original_compressing) {
                            if(!imagecopyresampled($img, $source, 0, 0, 0, 0, $newwidth_2, $newheight_2, $imgInfo[0], $imgInfo[1])) error("Ошибка обработки изображения!");
                        } else {
                            if(!imagecopyresampled($img, $source, 0, 0, 0, 0, $imgInfo[0], $imgInfo[1], $imgInfo[0], $imgInfo[1])) error("Ошибка обработки изображения!");
                        };
                        imagepng($img, $filename, 9);
                        break;
                }


            } else {
                switch ($end_type) {
                    case IMAGETYPE_JPEG:
                        $is_rotate = false;
                        if(isset($exif['Orientation'])) {
                            if($exif['Orientation'] == 3) {
                                $is_rotate = true;
                                $source = imagerotate($source, 180, 0);
                            } elseif($exif['Orientation'] == 6)
                                $source = imagerotate($source, 270, 0);
                            elseif($exif['Orientation'] == 8)
                                $source = imagerotate($source, 90, 0);
                            if($exif['Orientation'] == 6 || $exif['Orientation'] == 8) {
                                $is_rotate = true;
                                $temp = $imgInfo[0];
                                $imgInfo[0] = $imgInfo[1];
                                $imgInfo[1] = $temp;

                                $tmp = $width;
                                $width = $height;
                                $height = $tmp;

                                $tmp = $newwidth_2;
                                $newwidth_2 = $newheight_2;
                                $newheight_2 = $tmp;
                            }
                            $img = imagecreatetruecolor($newwidth_2, $newheight_2);
                            imagesetinterpolation($img, IMG_BICUBIC_FIXED);
                        }
                        if($original_compressing && $end_type == $imgInfo[2] && !$is_rotate && $jpeg_quality == JPEG_QUALITY::HIGHEST)
                            break;
                        if(!$original_compressing) {
                            $im_temp = $source;
                            if(!imagecopyresampled($img, $im_temp, 0, 0, 0, 0, $newwidth_2, $newheight_2, $width, $height)) error("Ошибка обработки изображения!");
                            imagejpeg($img, $filename, $jpeg_quality);

                        } else {
                            imagejpeg($source, $filename, $jpeg_quality);

                        }
                        break;

                    case IMAGETYPE_PNG:
                        if($original_compressing && $end_type == $imgInfo[2] && $jpeg_quality == JPEG_QUALITY::HIGHEST)
                            break;
                        imagealphablending($img, false);
                        imagesavealpha($img, true);
                        $transparent = imagecolorallocatealpha($img, 255, 255, 255, 127);
                        imagefilledrectangle($img, 0, 0, $imgInfo[0], $imgInfo[1], $transparent);
                        if(!$original_compressing) {
                            if(!imagecopyresampled($img, $source, 0, 0, 0, 0, $newwidth_2, $newheight_2, $imgInfo[0], $imgInfo[1])) error("Ошибка обработки изображения!");
                        } else {
                            if(!imagecopyresampled($img, $source, 0, 0, 0, 0, $imgInfo[0], $imgInfo[1], $imgInfo[0], $imgInfo[1])) error("Ошибка обработки изображения!");
                        }
                        $jpeg_quality /= 10;
                        $jpeg_quality = intval($jpeg_quality);
                        if($jpeg_quality > 9)
                            $jpeg_quality = 9;
                        imagepng($img, $filename, $jpeg_quality);
                        break;
                }
                if(isset($source))
                    imagedestroy($source);
                if(isset($im))
                    imagedestroy($im);
                if(isset($img))
                    imagedestroy($img);
            };
            if(file_exists($ip_filter_file))
                unlink($ip_filter_file);
        } catch (Throwable | Exception $e) {
            if(file_exists($ip_filter_file))
                unlink($ip_filter_file);
            if(file_exists($filename))
                unlink($filename);
            error($e->getMessage());
        }
        return true;
    }

    private static function create_watermark($main_img_obj, $text, $font, $r = 128, $g = 128, $b = 128, $alpha_level = 100)
    {
        $width = imagesx($main_img_obj);
        $height = imagesy($main_img_obj);
        $angle = -rad2deg(atan2((-$height), ($width)));
        $text = " " . $text . " ";
        $c = imagecolorallocatealpha($main_img_obj, $r, $g, $b, $alpha_level);
        $size = (($width + $height) / 2) * 2 / strlen($text);
        $box = imagettfbbox($size, $angle, $font, $text);
        $x = $width / 2 - abs($box[4] - $box[0]) / 2;
        $y = $height / 2 + abs($box[5] - $box[1]) / 2;
        imagettftext($main_img_obj, $size, $angle, $x, $y, $c, $font, $text);
        return $main_img_obj;
    }


} 