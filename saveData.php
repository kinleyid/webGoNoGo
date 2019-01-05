<?php
$filename = $_POST["filename"];
$filename = $filename . '.' . uniqid() . ".txt";
$filename = preg_replace('/[^a-z0-9\.]/', '', strtolower($filename));
$txt = $_POST["txt"];
$myfile = fopen($filename, "w") or die("Unable to open file!");
fwrite($myfile, $txt);
fclose($myfile);
?>