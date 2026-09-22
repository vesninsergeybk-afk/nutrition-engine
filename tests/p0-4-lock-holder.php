<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
if($argc<3){fwrite(STDERR,"usage: lock-holder <guard-dir> <hold-ms>\n");exit(64);}
$dir=$argv[1];
if(!is_dir($dir)&&!mkdir($dir,0700,true)&&!is_dir($dir)){fwrite(STDERR,"mkdir failed\n");exit(65);}
$fh=fopen($dir.'/state.lock','c+');
if(!$fh||!flock($fh,LOCK_EX)){fwrite(STDERR,"lock failed\n");exit(66);}
echo "LOCKED\n";flush();
$ms=max(0,min(5000,(int)$argv[2]));if($ms)usleep($ms*1000);
flock($fh,LOCK_UN);fclose($fh);
echo "UNLOCKED\n";
