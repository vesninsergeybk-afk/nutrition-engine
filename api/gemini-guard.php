<?php
declare(strict_types=1);

if (!defined('NUTRITION_GEMINI_INTERNAL')) {
    http_response_code(404);
    exit;
}

const NUTRITION_GUARD_SCHEMA = 'p0_4_1_v4';
const NUTRITION_GUARD_PREVIOUS_SCHEMAS = ['p0_4_1_v3','p0_4_1_v2','p0_4_v1'];
const NUTRITION_GUARD_STATE_RETENTION_SECONDS = 86400;
const NUTRITION_GUARD_LEASE_TTL_SECONDS = 120;
const NUTRITION_GUARD_CLOCK_SKEW_SECONDS = 30;
const NUTRITION_GUARD_DEFAULT_PRICING_REVIEWED_UNTIL = '2026-10-18';

function nutrition_guard_env_bool(string $name, bool $default): bool {
    $raw = getenv($name);
    if (!is_string($raw) || trim($raw) === '') return $default;
    $value = strtolower(trim($raw));
    if (in_array($value, ['1','true','yes','on','enabled'], true)) return true;
    if (in_array($value, ['0','false','no','off','disabled'], true)) return false;
    return $default;
}
function nutrition_guard_env_int(string $name, int $default, int $min, int $max): int {
    $raw = getenv($name);
    if (!is_string($raw) || !preg_match('/^-?\d+$/', trim($raw))) return $default;
    return max($min, min($max, (int)$raw));
}
function nutrition_guard_env_float(string $name, float $default, float $min, float $max): float {
    $raw = getenv($name);
    if (!is_string($raw) || !is_numeric(trim($raw))) return $default;
    $value = (float)trim($raw);
    if (!is_finite($value)) return $default;
    return max($min, min($max, $value));
}
function nutrition_guard_policy(): array {
    return [
        'global_concurrency' => nutrition_guard_env_int('NUTRITION_GEMINI_GLOBAL_CONCURRENCY', 2, 1, 20),
        'client_concurrency' => nutrition_guard_env_int('NUTRITION_GEMINI_CLIENT_CONCURRENCY', 1, 1, 5),
        'tokens_minute' => nutrition_guard_env_int('NUTRITION_GEMINI_TOKENS_PER_MINUTE', 750000, 1000, 100000000),
        'tokens_hour' => nutrition_guard_env_int('NUTRITION_GEMINI_TOKENS_PER_HOUR', 1000000, 10000, 100000000),
        'tokens_day' => nutrition_guard_env_int('NUTRITION_GEMINI_TOKENS_PER_DAY', 3000000, 50000, 1000000000),
        // Monetary budgets are stored as integer micro-USD. Rates are configurable so
        // pricing changes do not require a code deployment.
        'input_micro_usd_per_m_tokens' => nutrition_guard_env_int('NUTRITION_GEMINI_INPUT_MICRO_USD_PER_M_TOKENS', 1500000, 1500000, 1000000000),
        'output_micro_usd_per_m_tokens' => nutrition_guard_env_int('NUTRITION_GEMINI_OUTPUT_MICRO_USD_PER_M_TOKENS', 9000000, 9000000, 1000000000),
        'cost_micro_usd_minute' => nutrition_guard_env_int('NUTRITION_GEMINI_COST_MICRO_USD_PER_MINUTE', 2000000, 1000, 1000000000000),
        'cost_micro_usd_hour' => nutrition_guard_env_int('NUTRITION_GEMINI_COST_MICRO_USD_PER_HOUR', 5000000, 1000, 1000000000000),
        'cost_micro_usd_day' => nutrition_guard_env_int('NUTRITION_GEMINI_COST_MICRO_USD_PER_DAY', 20000000, 1000, 1000000000000),
        'provider_attempts_minute' => nutrition_guard_env_int('NUTRITION_GEMINI_PROVIDER_ATTEMPTS_MINUTE', 20, 1, 10000),
        'provider_attempts_10m' => nutrition_guard_env_int('NUTRITION_GEMINI_PROVIDER_ATTEMPTS_10M', 50, 5, 10000),
        'provider_attempts_hour' => nutrition_guard_env_int('NUTRITION_GEMINI_PROVIDER_ATTEMPTS_HOUR', 200, 10, 100000),
        'provider_attempts_day' => nutrition_guard_env_int('NUTRITION_GEMINI_PROVIDER_ATTEMPTS_DAY', 700, 20, 1000000),
        'circuit_failures' => nutrition_guard_env_int('NUTRITION_GEMINI_CIRCUIT_FAILURES', 5, 2, 50),
        'circuit_window' => nutrition_guard_env_int('NUTRITION_GEMINI_CIRCUIT_WINDOW_SECONDS', 300, 30, 3600),
        'circuit_open' => nutrition_guard_env_int('NUTRITION_GEMINI_CIRCUIT_OPEN_SECONDS', 120, 15, 3600),
        'state_max_bytes' => nutrition_guard_env_int('NUTRITION_GEMINI_GUARD_STATE_MAX_BYTES', 8388608, 262144, 67108864),
        'log_max_bytes' => nutrition_guard_env_int('NUTRITION_GEMINI_GUARD_LOG_MAX_BYTES', 5242880, 65536, 67108864),
        'log_retention_days' => nutrition_guard_env_int('NUTRITION_GEMINI_GUARD_LOG_RETENTION_DAYS', 14, 1, 90),
        'max_attempts' => [
            'explain' => nutrition_guard_env_int('NUTRITION_GEMINI_EXPLAIN_MAX_PROVIDER_ATTEMPTS', 3, 1, 12),
            'planner' => nutrition_guard_env_int('NUTRITION_GEMINI_PLANNER_MAX_PROVIDER_ATTEMPTS', 3, 1, 12),
            'media' => nutrition_guard_env_int('NUTRITION_GEMINI_MEDIA_MAX_PROVIDER_ATTEMPTS', 4, 1, 16),
        ],
        'kind_tokens' => [
            'explain' => ['minute'=>nutrition_guard_env_int('NUTRITION_GEMINI_EXPLAIN_TOKENS_PER_MINUTE',250000,1000,100000000),'hour'=>nutrition_guard_env_int('NUTRITION_GEMINI_EXPLAIN_TOKENS_PER_HOUR',350000,10000,100000000),'day'=>nutrition_guard_env_int('NUTRITION_GEMINI_EXPLAIN_TOKENS_PER_DAY',900000,20000,1000000000)],
            'planner' => ['minute'=>nutrition_guard_env_int('NUTRITION_GEMINI_PLANNER_TOKENS_PER_MINUTE',250000,1000,100000000),'hour'=>nutrition_guard_env_int('NUTRITION_GEMINI_PLANNER_TOKENS_PER_HOUR',350000,10000,100000000),'day'=>nutrition_guard_env_int('NUTRITION_GEMINI_PLANNER_TOKENS_PER_DAY',900000,20000,1000000000)],
            'media' => ['minute'=>nutrition_guard_env_int('NUTRITION_GEMINI_MEDIA_TOKENS_PER_MINUTE',700000,1000,100000000),'hour'=>nutrition_guard_env_int('NUTRITION_GEMINI_MEDIA_TOKENS_PER_HOUR',900000,10000,100000000),'day'=>nutrition_guard_env_int('NUTRITION_GEMINI_MEDIA_TOKENS_PER_DAY',1800000,20000,1000000000)],
        ],
        'kind_cost_micro_usd_day' => [
            'explain' => nutrition_guard_env_int('NUTRITION_GEMINI_EXPLAIN_COST_MICRO_USD_PER_DAY', 6000000, 1000, 1000000000000),
            'planner' => nutrition_guard_env_int('NUTRITION_GEMINI_PLANNER_COST_MICRO_USD_PER_DAY', 9000000, 1000, 1000000000000),
            'media' => nutrition_guard_env_int('NUTRITION_GEMINI_MEDIA_COST_MICRO_USD_PER_DAY', 15000000, 1000, 1000000000000),
        ],
        'actions' => [
            'explain' => [
                'client_minute' => nutrition_guard_env_int('NUTRITION_GEMINI_EXPLAIN_CLIENT_MINUTE', 2, 1, 1000),
                'subnet_minute' => nutrition_guard_env_int('NUTRITION_GEMINI_EXPLAIN_SUBNET_MINUTE', 6, 1, 10000),
                'global_minute' => nutrition_guard_env_int('NUTRITION_GEMINI_EXPLAIN_GLOBAL_MINUTE', 12, 1, 100000),
                'client_10m' => nutrition_guard_env_int('NUTRITION_GEMINI_EXPLAIN_CLIENT_10M', 6, 1, 1000),
                'client_hour' => nutrition_guard_env_int('NUTRITION_GEMINI_EXPLAIN_CLIENT_HOUR', 18, 1, 10000),
                'client_day' => nutrition_guard_env_int('NUTRITION_GEMINI_EXPLAIN_CLIENT_DAY', 60, 1, 100000),
                'subnet_10m' => nutrition_guard_env_int('NUTRITION_GEMINI_EXPLAIN_SUBNET_10M', 20, 1, 10000),
                'subnet_hour' => nutrition_guard_env_int('NUTRITION_GEMINI_EXPLAIN_SUBNET_HOUR', 60, 1, 100000),
                'global_10m' => nutrition_guard_env_int('NUTRITION_GEMINI_EXPLAIN_GLOBAL_10M', 30, 1, 100000),
                'global_hour' => nutrition_guard_env_int('NUTRITION_GEMINI_EXPLAIN_GLOBAL_HOUR', 120, 1, 1000000),
                'global_day' => nutrition_guard_env_int('NUTRITION_GEMINI_EXPLAIN_GLOBAL_DAY', 400, 1, 10000000),
            ],
            'planner' => [
                'client_minute' => nutrition_guard_env_int('NUTRITION_GEMINI_PLANNER_CLIENT_MINUTE', 2, 1, 1000),
                'subnet_minute' => nutrition_guard_env_int('NUTRITION_GEMINI_PLANNER_SUBNET_MINUTE', 4, 1, 10000),
                'global_minute' => nutrition_guard_env_int('NUTRITION_GEMINI_PLANNER_GLOBAL_MINUTE', 8, 1, 100000),
                'client_10m' => nutrition_guard_env_int('NUTRITION_GEMINI_PLANNER_CLIENT_10M', 4, 1, 1000),
                'client_hour' => nutrition_guard_env_int('NUTRITION_GEMINI_PLANNER_CLIENT_HOUR', 12, 1, 10000),
                'client_day' => nutrition_guard_env_int('NUTRITION_GEMINI_PLANNER_CLIENT_DAY', 40, 1, 100000),
                'subnet_10m' => nutrition_guard_env_int('NUTRITION_GEMINI_PLANNER_SUBNET_10M', 12, 1, 10000),
                'subnet_hour' => nutrition_guard_env_int('NUTRITION_GEMINI_PLANNER_SUBNET_HOUR', 40, 1, 100000),
                'global_10m' => nutrition_guard_env_int('NUTRITION_GEMINI_PLANNER_GLOBAL_10M', 20, 1, 100000),
                'global_hour' => nutrition_guard_env_int('NUTRITION_GEMINI_PLANNER_GLOBAL_HOUR', 80, 1, 1000000),
                'global_day' => nutrition_guard_env_int('NUTRITION_GEMINI_PLANNER_GLOBAL_DAY', 240, 1, 10000000),
            ],
            'media' => [
                'client_minute' => nutrition_guard_env_int('NUTRITION_GEMINI_MEDIA_CLIENT_MINUTE', 1, 1, 1000),
                'subnet_minute' => nutrition_guard_env_int('NUTRITION_GEMINI_MEDIA_SUBNET_MINUTE', 3, 1, 10000),
                'global_minute' => nutrition_guard_env_int('NUTRITION_GEMINI_MEDIA_GLOBAL_MINUTE', 5, 1, 100000),
                'client_10m' => nutrition_guard_env_int('NUTRITION_GEMINI_MEDIA_CLIENT_10M', 3, 1, 1000),
                'client_hour' => nutrition_guard_env_int('NUTRITION_GEMINI_MEDIA_CLIENT_HOUR', 8, 1, 10000),
                'client_day' => nutrition_guard_env_int('NUTRITION_GEMINI_MEDIA_CLIENT_DAY', 20, 1, 100000),
                'subnet_10m' => nutrition_guard_env_int('NUTRITION_GEMINI_MEDIA_SUBNET_10M', 8, 1, 10000),
                'subnet_hour' => nutrition_guard_env_int('NUTRITION_GEMINI_MEDIA_SUBNET_HOUR', 24, 1, 100000),
                'global_10m' => nutrition_guard_env_int('NUTRITION_GEMINI_MEDIA_GLOBAL_10M', 12, 1, 100000),
                'global_hour' => nutrition_guard_env_int('NUTRITION_GEMINI_MEDIA_GLOBAL_HOUR', 40, 1, 1000000),
                'global_day' => nutrition_guard_env_int('NUTRITION_GEMINI_MEDIA_GLOBAL_DAY', 100, 1, 10000000),
            ],
        ],
    ];
}
function nutrition_guard_path_inside(string $path,string $parent): bool {
    $path=rtrim(str_replace('\\','/',realpath($path)?:$path),'/').'/';
    $parent=rtrim(str_replace('\\','/',realpath($parent)?:$parent),'/').'/';
    return $parent!=='/' && str_starts_with($path,$parent);
}
function nutrition_guard_storage_dir(): string {
    static $dir = null;
    if (is_string($dir)) return $dir;
    $configured = getenv('NUTRITION_GEMINI_GUARD_DIR');
    $hasConfigured=is_string($configured)&&trim($configured)!=='';
    $base=$hasConfigured?trim((string)$configured):'';
    if(!$hasConfigured){
        $docrootRaw=trim((string)($_SERVER['DOCUMENT_ROOT']??''));$docroot=$docrootRaw!==''?realpath($docrootRaw):false;
        if(is_string($docroot)&&$docroot!==''&&$docroot!==DIRECTORY_SEPARATOR){
            $parent=dirname($docroot);$base=rtrim($parent,DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.'.nutrition-gemini-guard-'.substr(hash('sha256',(string)realpath(__DIR__)),0,16);
        }
        if($base===''||(!is_dir($base)&&!is_writable(dirname($base)))){
            $requirePersistent=nutrition_guard_env_bool('NUTRITION_GEMINI_REQUIRE_PERSISTENT_GUARD',true);
            $allowEphemeral=nutrition_guard_env_bool('NUTRITION_GEMINI_ALLOW_EPHEMERAL_GUARD',false)||!$requirePersistent;
            if(!$allowEphemeral)throw new RuntimeException('guard_persistent_storage_required');
            $base=rtrim(sys_get_temp_dir(),DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.'nutrition-gemini-guard-'.substr(hash('sha256',(string)realpath(__DIR__)),0,16);
        }
    }
    if (!is_dir($base) && !@mkdir($base, 0700, true) && !is_dir($base)) throw new RuntimeException('guard_storage_create_failed');
    $real=realpath($base);if(!is_string($real)||$real==='')throw new RuntimeException('guard_storage_realpath_failed');
    $docroot=trim((string)($_SERVER['DOCUMENT_ROOT']??''));
    if($docroot!==''&&is_dir($docroot)&&nutrition_guard_path_inside($real,$docroot)&&!nutrition_guard_env_bool('NUTRITION_GEMINI_ALLOW_GUARD_IN_WEBROOT',false))throw new RuntimeException('guard_storage_inside_webroot');
    @chmod($real, 0700);
    if (!is_writable($real)) throw new RuntimeException('guard_storage_not_writable');
    if(PHP_OS_FAMILY!=='Windows'){
        $perms=@fileperms($real);if(is_int($perms)&&(($perms&0077)!==0))throw new RuntimeException('guard_storage_permissions_unsafe');
    }
    $dir = $real;
    return $dir;
}
function nutrition_guard_paths(): array {
    $dir = nutrition_guard_storage_dir();
    return ['state'=>$dir.'/state.json','backup'=>$dir.'/state.backup.json','status'=>$dir.'/public-status.json','lock'=>$dir.'/state.lock','log'=>$dir.'/events-'.date('Y-m-d').'.jsonl','integrity'=>$dir.'/integrity-failed.flag'];
}
function nutrition_guard_initial_state(): array {
    return ['schema'=>NUTRITION_GUARD_SCHEMA,'revision'=>0,'updated_at'=>time(),'actions'=>[],'attempts'=>[],'tokens'=>[],'costs'=>[],'failures'=>[],'inflight'=>[],'provider_backoff_until'=>0];
}
function nutrition_guard_migrate_state(mixed $state): ?array {
    if (!is_array($state)) return null;
    $schema=(string)($state['schema']??'');
    if ($schema!==NUTRITION_GUARD_SCHEMA && !in_array($schema,NUTRITION_GUARD_PREVIOUS_SCHEMAS,true)) return null;
    foreach (['actions','attempts','tokens','failures','inflight'] as $key) if (!is_array($state[$key]??null)) return null;
    if (!isset($state['costs'])) $state['costs']=[];
    if (!is_array($state['costs'])) return null;
    $state['revision']=max(0,(int)($state['revision']??0));
    if ($schema!==NUTRITION_GUARD_SCHEMA) {
        // Reconstruct monetary history conservatively from retained token rows so a
        // deployment cannot reset the financial budget merely by changing schemas.
        if (!$state['costs']) {
            foreach ($state['tokens'] as $tokenRow) {
                if (!is_array($tokenRow)) continue;
                $total=max(0,(int)($tokenRow['total']??0));if($total<=0)continue;
                $estimated=!empty($tokenRow['estimated']);
                $state['costs'][]=['ts'=>(int)($tokenRow['ts']??time()),'kind'=>(string)($tokenRow['kind']??'explain'),'micro_usd'=>nutrition_guard_actual_cost_micro_usd($tokenRow,$total,$estimated),'estimated'=>$estimated,'reason'=>'schema_migration','model'=>(string)($tokenRow['model']??'')];
            }
        }
        foreach ($state['inflight'] as $id=>&$lease) {
            if (!is_array($lease)) continue;
            $estimated=max(500,(int)($lease['estimated_tokens_per_attempt']??$lease['reserved_tokens']??500));
            $actual=max(0,(int)($lease['actual_tokens']??0));
            $lease['estimated_tokens_per_attempt']=$estimated;
            $lease['pending_tokens']=max(0,(int)($lease['pending_tokens']??max(0,$estimated-$actual)));
            $estimatedCost=nutrition_guard_estimated_cost_micro_usd($estimated);
            $lease['estimated_cost_micro_usd_per_attempt']=max(1,(int)($lease['estimated_cost_micro_usd_per_attempt']??$estimatedCost));
            $lease['pending_cost_micro_usd']=max(0,(int)($lease['pending_cost_micro_usd']??$estimatedCost));
            $lease['actual_cost_micro_usd']=max(0,(int)($lease['actual_cost_micro_usd']??0));
            unset($lease['reserved_tokens']);
        }
        unset($lease);
        $state['schema']=NUTRITION_GUARD_SCHEMA;
    }
    return $state;
}
function nutrition_guard_valid_state(mixed $state): bool {
    return is_array(nutrition_guard_migrate_state($state));
}
function nutrition_guard_read_state_file(string $path): ?array {
    if (!is_file($path)) return null;
    $raw = @file_get_contents($path);
    if (!is_string($raw) || trim($raw) === '') return null;
    return nutrition_guard_migrate_state(json_decode($raw, true));
}
function nutrition_guard_read_best_state(array $paths): ?array {
    $primary=nutrition_guard_read_state_file($paths['state']);$backup=nutrition_guard_read_state_file($paths['backup']);
    if(!is_array($primary))return is_array($backup)?$backup:null;
    if(!is_array($backup))return$primary;
    $primaryRevision=(int)($primary['revision']??0);$backupRevision=(int)($backup['revision']??0);
    if($backupRevision>$primaryRevision)return$backup;
    if($primaryRevision>$backupRevision)return$primary;
    // Primary wins an exact tie; both files should be byte-identical after a successful commit.
    return (int)($backup['updated_at']??0)>(int)($primary['updated_at']??0)?$backup:$primary;
}
function nutrition_guard_encode_state(array $state): string {
    $state['schema'] = NUTRITION_GUARD_SCHEMA;
    $encoded = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($encoded)) throw new RuntimeException('guard_state_encode_failed');
    $maxBytes = (int)(nutrition_guard_policy()['state_max_bytes'] ?? 8388608);
    if (strlen($encoded) > $maxBytes) throw new RuntimeException('guard_state_size_limit');
    return $encoded;
}
function nutrition_guard_atomic_write_file(string $path, string $encoded, string $errorPrefix): void {
    $tmp = $path.'.tmp.'.getmypid().'.'.bin2hex(random_bytes(4));
    $fh=@fopen($tmp,'xb');
    if(!$fh)throw new RuntimeException($errorPrefix.'_write_failed');
    try {
        $offset=0;$length=strlen($encoded);
        while($offset<$length){
            $written=@fwrite($fh,substr($encoded,$offset));
            if(!is_int($written)||$written<1)throw new RuntimeException($errorPrefix.'_write_failed');
            $offset+=$written;
        }
        if(!@fflush($fh))throw new RuntimeException($errorPrefix.'_flush_failed');
        if(function_exists('fsync')&&!@fsync($fh))throw new RuntimeException($errorPrefix.'_fsync_failed');
    } finally { @fclose($fh); }
    @chmod($tmp,0600);
    if(!@rename($tmp,$path)){@unlink($tmp);throw new RuntimeException($errorPrefix.'_rename_failed');}
    @chmod($path,0600);
}
function nutrition_guard_write_state(array $state, array $paths): void {
    $state['schema']=NUTRITION_GUARD_SCHEMA;
    $state['revision']=nutrition_guard_safe_add_int(max(0,(int)($state['revision']??0)),1);
    $state['updated_at']=time();
    $encoded=nutrition_guard_encode_state($state);
    // Both copies receive the same revision. Backup is committed first; if primary then
    // fails, the next read selects the newer valid backup instead of losing the ledger.
    nutrition_guard_atomic_write_file($paths['backup'],$encoded,'guard_backup');
    nutrition_guard_atomic_write_file($paths['state'],$encoded,'guard_state');
    try { nutrition_guard_write_public_snapshot($state,$paths); }
    catch(Throwable $error){error_log('[nutrition-gemini-guard] public snapshot failure: '.preg_replace('/[^A-Za-z0-9_.:-]/','_', $error->getMessage()));}
}

function nutrition_guard_with_state(callable $callback, bool $write = true): mixed {
    $paths = nutrition_guard_paths();
    $lock = @fopen($paths['lock'], 'c+');
    if (!$lock) throw new RuntimeException('guard_lock_open_failed');
    @chmod($paths['lock'], 0600);
    $deadline = microtime(true) + 1.5;
    $locked = false;
    do {
        $locked = @flock($lock, ($write ? LOCK_EX : LOCK_SH) | LOCK_NB);
        if (!$locked) usleep(20000);
    } while (!$locked && microtime(true) < $deadline);
    if (!$locked) { fclose($lock); throw new RuntimeException('guard_lock_timeout'); }
    try {
        $state = nutrition_guard_read_best_state($paths);
        if (!is_array($state)) {
            if (is_file($paths['state']) || is_file($paths['backup'])) throw new RuntimeException('guard_state_corrupt');
            $state = nutrition_guard_initial_state();
        }
        nutrition_guard_prune_state($state, time());
        $result = $callback($state);
        if ($write) nutrition_guard_write_state($state, $paths);
        return $result;
    } finally {
        @flock($lock, LOCK_UN);
        fclose($lock);
    }
}
function nutrition_guard_prune_events(array $events,int $now): array {
    $cutoff=$now-NUTRITION_GUARD_STATE_RETENTION_SECONDS;$out=[];
    foreach($events as $row){
        if(!is_array($row))continue;$ts=(int)($row['ts']??0);
        if($ts>$now+NUTRITION_GUARD_CLOCK_SKEW_SECONDS)throw new RuntimeException('guard_clock_anomaly');
        if($ts>$cutoff)$out[]=$row;
    }
    return array_values($out);
}
function nutrition_guard_prune_state(array &$state, int $now): void {
    $updated=(int)($state['updated_at']??0);if($updated>$now+NUTRITION_GUARD_CLOCK_SKEW_SECONDS)throw new RuntimeException('guard_clock_anomaly');
    foreach (['actions','attempts','tokens','costs','failures'] as $key) $state[$key] = nutrition_guard_prune_events(is_array($state[$key] ?? null) ? $state[$key] : [], $now);
    $inflight = is_array($state['inflight'] ?? null) ? $state['inflight'] : [];
    foreach ($inflight as $id => $lease) if (!is_array($lease) || (int)($lease['expires_at'] ?? 0) <= $now) unset($inflight[$id]);
    $state['inflight'] = $inflight;
    if ((int)($state['provider_backoff_until'] ?? 0) <= $now) $state['provider_backoff_until'] = 0;
}
function nutrition_guard_ip_in_cidr(string $ip, string $cidr): bool {
    $cidr=trim($cidr);if($cidr==='')return false;
    if(!str_contains($cidr,'/'))return hash_equals(strtolower($cidr),strtolower($ip));
    [$network,$prefixRaw]=array_pad(explode('/',$cidr,2),2,'');
    if(!filter_var($ip,FILTER_VALIDATE_IP)||!filter_var($network,FILTER_VALIDATE_IP)||!preg_match('/^\d+$/',$prefixRaw))return false;
    $ipBin=@inet_pton($ip);$networkBin=@inet_pton($network);if(!is_string($ipBin)||!is_string($networkBin)||strlen($ipBin)!==strlen($networkBin))return false;
    $bits=strlen($ipBin)*8;$prefix=(int)$prefixRaw;if($prefix<0||$prefix>$bits)return false;
    $bytes=intdiv($prefix,8);$remaining=$prefix%8;
    if($bytes>0&&substr($ipBin,0,$bytes)!==substr($networkBin,0,$bytes))return false;
    if($remaining===0)return true;
    $mask=(0xFF << (8-$remaining)) & 0xFF;
    return (ord($ipBin[$bytes]) & $mask)===(ord($networkBin[$bytes]) & $mask);
}
function nutrition_guard_trusted_proxy_entries(): array {
    $raw=(string)(getenv('NUTRITION_GEMINI_TRUSTED_PROXIES')?:'');
    return array_values(array_filter(array_map('trim',preg_split('/[,;\s]+/',$raw,-1,PREG_SPLIT_NO_EMPTY)?:[])));
}
function nutrition_guard_is_trusted_proxy(string $ip): bool {
    if(!nutrition_guard_env_bool('NUTRITION_GEMINI_TRUST_PROXY',false)||!filter_var($ip,FILTER_VALIDATE_IP))return false;
    foreach(nutrition_guard_trusted_proxy_entries() as $entry)if(nutrition_guard_ip_in_cidr($ip,$entry))return true;
    return false;
}
function nutrition_guard_forwarded_chain(): array {
    $raw=trim((string)($_SERVER['HTTP_X_FORWARDED_FOR']??''));if($raw==='')return[];
    $out=[];foreach(explode(',',$raw) as $part){$ip=trim($part);if(filter_var($ip,FILTER_VALIDATE_IP))$out[]=$ip;}
    return$out;
}
function nutrition_guard_trusted_client_ip_header(): string {
    $value=strtolower(trim((string)(getenv('NUTRITION_GEMINI_TRUSTED_CLIENT_IP_HEADER')?:'x-forwarded-for')));
    return in_array($value,['x-forwarded-for','x-real-ip','cf-connecting-ip'],true)?$value:'x-forwarded-for';
}
function nutrition_guard_normalize_remote_ip(): string {
    $remote=trim((string)($_SERVER['REMOTE_ADDR']??'0.0.0.0'));
    if(!filter_var($remote,FILTER_VALIDATE_IP))$remote='0.0.0.0';
    if(!nutrition_guard_is_trusted_proxy($remote))return$remote;
    $header=nutrition_guard_trusted_client_ip_header();
    if($header==='x-forwarded-for'){
        $chain=nutrition_guard_forwarded_chain();
        if($chain){
            $candidate=$remote;
            for($i=count($chain)-1;$i>=0;$i--){
                if(!nutrition_guard_is_trusted_proxy($candidate))break;
                $candidate=$chain[$i];
            }
            if(filter_var($candidate,FILTER_VALIDATE_IP))return$candidate;
        }
        return$remote;
    }
    $serverKey=$header==='cf-connecting-ip'?'HTTP_CF_CONNECTING_IP':'HTTP_X_REAL_IP';
    $candidate=trim((string)($_SERVER[$serverKey]??''));
    return filter_var($candidate,FILTER_VALIDATE_IP)?$candidate:$remote;
}
function nutrition_guard_request_is_https(): bool {
    if(nutrition_guard_env_bool('NUTRITION_GEMINI_FORCE_HTTPS_COOKIE',false))return true;
    if((!empty($_SERVER['HTTPS'])&&strtolower((string)$_SERVER['HTTPS'])!=='off')||(string)($_SERVER['SERVER_PORT']??'')==='443')return true;
    $remote=trim((string)($_SERVER['REMOTE_ADDR']??''));if(!nutrition_guard_is_trusted_proxy($remote))return false;
    $raw=trim((string)($_SERVER['HTTP_X_FORWARDED_PROTO']??''));if($raw==='')return false;
    $parts=array_values(array_filter(array_map('trim',explode(',',$raw)),static fn($v)=>$v!==''));
    return strtolower((string)($parts[count($parts)-1]??''))==='https';
}
function nutrition_guard_subnet(string $ip): string {
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        $parts = explode('.', $ip);
        return implode('.', array_slice($parts, 0, 3)).'.0/24';
    }
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
        $packed = @inet_pton($ip);
        if (is_string($packed)) {
            $prefix = substr($packed, 0, 7)."\0".str_repeat("\0", 8);
            $text = @inet_ntop($prefix);
            if (is_string($text)) return $text.'/56';
        }
    }
    return 'unknown';
}
function nutrition_guard_hmac_secret(): string {
    static $secret = null;
    if (is_string($secret)) return $secret;
    $env = getenv('NUTRITION_GEMINI_GUARD_SALT');
    if (is_string($env) && strlen(trim($env)) >= 24) return $secret = trim($env);
    $keyMaterial = '';
    if (function_exists('load_api_key')) $keyMaterial = (string)load_api_key();
    return $secret = hash('sha256', $keyMaterial.'|'.(string)realpath(__DIR__).'|nutrition-guard-p0.4');
}
function nutrition_guard_identity(): array {
    $ip = nutrition_guard_normalize_remote_ip();
    $subnet = nutrition_guard_subnet($ip);
    $secret = nutrition_guard_hmac_secret();
    return ['client'=>hash_hmac('sha256', 'ip|'.$ip, $secret),'subnet'=>hash_hmac('sha256', 'subnet|'.$subnet, $secret)];
}
function nutrition_guard_integrity_flag_paths(): array {
    $out=[];
    $configured=getenv('NUTRITION_GEMINI_INTEGRITY_FLAG_FILE');
    if(is_string($configured)&&trim($configured)!=='')$out[]=trim($configured);
    try{$out[]=nutrition_guard_paths()['integrity'];}catch(Throwable){}
    // Emergency fallback remains server-side and is denied by the shipped .htaccess.
    $out[]=__DIR__.'/integrity-failed.flag';
    return array_values(array_unique(array_filter($out,static fn($value):bool=>is_string($value)&&trim($value)!=='')));
}
function nutrition_guard_integrity_is_locked(): bool {
    if(!empty($GLOBALS['NUTRITION_GEMINI_INTEGRITY_LOCKDOWN']))return true;
    foreach(nutrition_guard_integrity_flag_paths() as$path)if(is_file($path))return true;
    return false;
}
function nutrition_guard_mark_integrity_failure(string $reason): void {
    $GLOBALS['NUTRITION_GEMINI_INTEGRITY_LOCKDOWN']=true;
    $payload=json_encode(['ts'=>gmdate('c'),'reason'=>substr(preg_replace('/[^A-Za-z0-9_.:-]/','_', $reason)??'accounting_failure',0,100)],JSON_UNESCAPED_SLASHES);
    if(!is_string($payload)){$payload='{"reason":"accounting_failure"}';}
    $written=false;
    $emergencyFallback=__DIR__.'/integrity-failed.flag';
    foreach(nutrition_guard_integrity_flag_paths() as$path){
        if($path===$emergencyFallback&&$written)continue;
        try{
            $parent=dirname($path);if(!is_dir($parent)||!is_writable($parent))continue;
            nutrition_guard_atomic_write_file($path,$payload,'guard_integrity_flag');$written=true;
        }catch(Throwable $error){error_log('[nutrition-gemini-guard] integrity flag failure: '.preg_replace('/[^A-Za-z0-9_.:-]/','_', $error->getMessage()));}
    }
    if(!$written)error_log('[nutrition-gemini-guard] CRITICAL: integrity lockdown could not be persisted; current PHP process remains locked');
}
function nutrition_guard_pricing_review_status(?int $now=null): array {
    $raw=getenv('NUTRITION_GEMINI_PRICING_REVIEWED_UNTIL');
    $date=is_string($raw)&&trim($raw)!==''?trim($raw):NUTRITION_GUARD_DEFAULT_PRICING_REVIEWED_UNTIL;
    $parsed=DateTimeImmutable::createFromFormat('!Y-m-d',$date,new DateTimeZone('UTC'));
    $errors=DateTimeImmutable::getLastErrors();
    if(!$parsed||($errors!==false&&(($errors['warning_count']??0)>0||($errors['error_count']??0)>0))||$parsed->format('Y-m-d')!==$date)return['valid'=>false,'code'=>'guard_pricing_review_invalid','reviewed_until'=>$date];
    $today=(new DateTimeImmutable('@'.($now??time())))->setTimezone(new DateTimeZone('UTC'))->setTime(0,0);
    if($parsed<$today)return['valid'=>false,'code'=>'guard_pricing_review_required','reviewed_until'=>$date];
    return['valid'=>true,'code'=>'','reviewed_until'=>$date];
}
function nutrition_guard_kill_switch(): array {
    if (!nutrition_guard_env_bool('NUTRITION_GEMINI_ENABLED', true)) return ['disabled'=>true,'code'=>'ai_kill_switch_env'];
    $pricing=nutrition_guard_pricing_review_status();
    if(!$pricing['valid'])return['disabled'=>true,'code'=>$pricing['code']];
    $flag = getenv('NUTRITION_GEMINI_KILL_SWITCH_FILE');
    $path = is_string($flag) && trim($flag) !== '' ? trim($flag) : __DIR__.'/gemini-disabled.flag';
    if (is_file($path)) return ['disabled'=>true,'code'=>'ai_kill_switch_file'];
    if(nutrition_guard_integrity_is_locked())return ['disabled'=>true,'code'=>'guard_integrity_lockdown'];
    try { nutrition_guard_paths(); }
    catch (Throwable $error) { throw nutrition_guard_storage_exception($error); }
    return ['disabled'=>false,'code'=>''];
}
function nutrition_guard_count(array $events, int $now, int $window, ?string $kind = null, ?string $field = null, ?string $value = null): int {
    $cutoff = $now - $window;
    $count = 0;
    foreach ($events as $row) {
        if (!is_array($row) || (int)($row['ts'] ?? 0) <= $cutoff) continue;
        if ($kind !== null && ($row['kind'] ?? '') !== $kind) continue;
        if ($field !== null && ($row[$field] ?? '') !== $value) continue;
        $count++;
    }
    return $count;
}
function nutrition_guard_sum_tokens(array $events, int $now, int $window, ?string $kind = null): int {
    $cutoff = $now - $window; $sum = 0;
    foreach ($events as $row) {
        if (!is_array($row) || (int)($row['ts'] ?? 0) <= $cutoff) continue;
        if ($kind !== null && ($row['kind'] ?? '') !== $kind) continue;
        $sum = nutrition_guard_safe_add_int($sum,max(0, (int)($row['total'] ?? 0)));
    }
    return $sum;
}
function nutrition_guard_safe_add_int(int $left,int $right): int {
    $left=max(0,$left);$right=max(0,$right);
    return $left>PHP_INT_MAX-$right?PHP_INT_MAX:$left+$right;
}
function nutrition_guard_budget_exceeded(int $used,int $additional,int $limit): bool {
    $used=max(0,$used);$additional=max(0,$additional);$limit=max(0,$limit);
    return $used>=$limit||$additional>$limit-$used;
}
function nutrition_guard_ceil_mul_div(int $value,int $rate,int $divisor=1000000): int {
    $value=max(0,$value);$rate=max(0,$rate);$divisor=max(1,$divisor);
    if($value===0||$rate===0)return 0;
    if($value>intdiv(PHP_INT_MAX-($divisor-1),$rate))return PHP_INT_MAX;
    return intdiv($value*$rate+$divisor-1,$divisor);
}
function nutrition_guard_estimated_cost_micro_usd(int $tokens): int {
    $policy=nutrition_guard_policy();
    return nutrition_guard_ceil_mul_div(max(0,$tokens),(int)$policy['output_micro_usd_per_m_tokens']);
}
function nutrition_guard_actual_cost_micro_usd(array $details,int $total,bool $estimated=false): int {
    $total=max(0,$total);if($total===0)return 0;
    $policy=nutrition_guard_policy();
    if($estimated)return nutrition_guard_ceil_mul_div($total,(int)$policy['output_micro_usd_per_m_tokens']);
    $prompt=max(0,(int)($details['prompt']??0));$tool=max(0,(int)($details['tool_use']??0));$cached=max(0,(int)($details['cached']??0));
    $output=max(0,(int)($details['output']??0));$thoughts=max(0,(int)($details['thoughts']??0));
    $known=$prompt+$tool+$output+$thoughts;
    // Cached tokens are deliberately not subtracted: charging them at the normal input rate
    // is conservative and avoids relying on model-specific cache discounts.
    $inputCharge=$prompt+$tool+$cached;
    $unclassified=max(0,$total-$known);
    return nutrition_guard_safe_add_int(nutrition_guard_ceil_mul_div($inputCharge,(int)$policy['input_micro_usd_per_m_tokens']),nutrition_guard_ceil_mul_div(nutrition_guard_safe_add_int(nutrition_guard_safe_add_int($output,$thoughts),$unclassified),(int)$policy['output_micro_usd_per_m_tokens']));
}
function nutrition_guard_sum_cost(array $events,int $now,int $window,?string $kind=null): int {
    $cutoff=$now-$window;$sum=0;
    foreach($events as$row){if(!is_array($row)||(int)($row['ts']??0)<=$cutoff)continue;if($kind!==null&&($row['kind']??'')!==$kind)continue;$sum=nutrition_guard_safe_add_int($sum,max(0,(int)($row['micro_usd']??0)));}
    return$sum;
}
function nutrition_guard_retry_after(array $events, int $now, int $window, ?string $kind = null, ?string $field = null, ?string $value = null): int {
    $cutoff = $now - $window; $oldest = null;
    foreach ($events as $row) {
        if (!is_array($row)) continue;
        $ts = (int)($row['ts'] ?? 0);
        if ($ts <= $cutoff) continue;
        if ($kind !== null && ($row['kind'] ?? '') !== $kind) continue;
        if ($field !== null && ($row[$field] ?? '') !== $value) continue;
        if ($oldest === null || $ts < $oldest) $oldest = $ts;
    }
    return $oldest === null ? 1 : max(1, $oldest + $window - $now);
}
function nutrition_guard_inflight_retry_after(array $state, int $now, ?string $kind = null): int {
    $soonest=null;
    foreach (is_array($state['inflight']??null)?$state['inflight']:[] as $lease) {
        if(!is_array($lease)||($kind!==null&&($lease['kind']??'')!==$kind))continue;
        $expires=(int)($lease['expires_at']??0);if($expires<=$now)continue;
        $wait=$expires-$now;if($soonest===null||$wait<$soonest)$soonest=$wait;
    }
    return $soonest===null?1:max(1,$soonest);
}
function nutrition_guard_throw_limit(string $code, int $retryAfter, string $message): never {
    throw new GeminiApiException($message, 429, max(1, $retryAfter), true, $code, 0);
}
function nutrition_guard_storage_exception(Throwable $error): GeminiApiException {
    error_log('[nutrition-gemini-guard] storage failure: '.preg_replace('/[^A-Za-z0-9_.:-]/', '_', $error->getMessage()));
    return new GeminiApiException('Защитный контур Gemini временно недоступен. Внешний вызов остановлен, чтобы не потерять контроль над бюджетом.', 503, 5, true, 'guard_storage_unavailable', 0);
}
function nutrition_guard_check_action_limit(array $state, array $limits, string $kind, array $identity, int $now): void {
    $checks = [
        ['client_minute',60,'client',$identity['client'],'guard_client_minute'],
        ['client_10m',600,'client',$identity['client'],'guard_client_10m'],
        ['client_hour',3600,'client',$identity['client'],'guard_client_hour'],
        ['client_day',86400,'client',$identity['client'],'guard_client_day'],
        ['subnet_minute',60,'subnet',$identity['subnet'],'guard_subnet_minute'],
        ['subnet_10m',600,'subnet',$identity['subnet'],'guard_subnet_10m'],
        ['subnet_hour',3600,'subnet',$identity['subnet'],'guard_subnet_hour'],
        ['global_minute',60,null,null,'guard_global_minute'],
        ['global_10m',600,null,null,'guard_global_10m'],
        ['global_hour',3600,null,null,'guard_global_hour'],
        ['global_day',86400,null,null,'guard_global_day'],
    ];
    foreach ($checks as [$name,$window,$field,$value,$code]) {
        $limit = (int)($limits[$name] ?? 0);
        if ($limit < 1) continue;
        $count = nutrition_guard_count($state['actions'], $now, $window, $kind, $field, $value);
        if ($count >= $limit) nutrition_guard_throw_limit($code, nutrition_guard_retry_after($state['actions'], $now, $window, $kind, $field, $value), 'Локальный защитный бюджет этой AI-операции временно исчерпан. Основной расчёт остаётся доступен без Gemini.');
    }
}
function nutrition_guard_circuit_status(array $state, array $policy, int $now): array {
    $backoff = (int)($state['provider_backoff_until'] ?? 0);
    if ($backoff > $now) return ['open'=>true,'retry_after'=>$backoff-$now,'code'=>'guard_provider_backoff'];
    $window = (int)$policy['circuit_window'];
    $failures = array_values(array_filter($state['failures'], static fn($row): bool => is_array($row) && (int)($row['ts'] ?? 0) > $now - $window && !empty($row['retryable'])));
    if (count($failures) >= (int)$policy['circuit_failures']) {
        $last = max(array_map(static fn($row): int => (int)$row['ts'], $failures));
        $until = $last + (int)$policy['circuit_open'];
        if ($until > $now) return ['open'=>true,'retry_after'=>$until-$now,'code'=>'guard_circuit_open'];
    }
    return ['open'=>false,'retry_after'=>0,'code'=>''];
}
function nutrition_guard_pending_tokens(array $state, ?string $kind=null): int {
    $sum=0;foreach(is_array($state['inflight']??null)?$state['inflight']:[] as $lease){if(!is_array($lease))continue;if($kind!==null&&($lease['kind']??'')!==$kind)continue;$sum=nutrition_guard_safe_add_int($sum,max(0,(int)($lease['pending_tokens']??max(0,(int)($lease['reserved_tokens']??0)-(int)($lease['actual_tokens']??0)))));}return$sum;
}
function nutrition_guard_pending_cost(array $state,?string $kind=null): int {
    $sum=0;foreach(is_array($state['inflight']??null)?$state['inflight']:[] as$lease){if(!is_array($lease))continue;if($kind!==null&&($lease['kind']??'')!==$kind)continue;$sum=nutrition_guard_safe_add_int($sum,max(0,(int)($lease['pending_cost_micro_usd']??nutrition_guard_estimated_cost_micro_usd((int)($lease['pending_tokens']??0)))));}return$sum;
}
function nutrition_guard_check_cost_budget(array $state,array $policy,string $kind,int $additionalCost,int $now): void {
    $additionalCost=max(0,$additionalCost);$pending=nutrition_guard_pending_cost($state);$costs=is_array($state['costs']??null)?$state['costs']:[];
    foreach([[60,'cost_micro_usd_minute','guard_cost_minute'],[3600,'cost_micro_usd_hour','guard_cost_hour'],[86400,'cost_micro_usd_day','guard_cost_day']]as[$window,$key,$code]){
        $limit=(int)($policy[$key]??0);if($limit<1)continue;$used=nutrition_guard_safe_add_int(nutrition_guard_sum_cost($costs,$now,(int)$window),$pending);
        if(nutrition_guard_budget_exceeded($used,$additionalCost,$limit))nutrition_guard_throw_limit($code,max(nutrition_guard_retry_after($costs,$now,(int)$window),nutrition_guard_inflight_retry_after($state,$now)),'Локальный денежный бюджет Gemini временно исчерпан. Основной расчёт остаётся доступен без внешнего AI.');
    }
    $kindLimit=(int)($policy['kind_cost_micro_usd_day'][$kind]??0);
    if($kindLimit>0){
        $used=nutrition_guard_safe_add_int(nutrition_guard_sum_cost($costs,$now,86400,$kind),nutrition_guard_pending_cost($state,$kind));
        if(nutrition_guard_budget_exceeded($used,$additionalCost,$kindLimit))nutrition_guard_throw_limit('guard_'.$kind.'_cost_day',max(nutrition_guard_retry_after($costs,$now,86400,$kind),nutrition_guard_inflight_retry_after($state,$now,$kind)),'Суточный денежный бюджет этой AI-функции исчерпан; локальный расчёт и другие разрешённые функции остаются доступными.');
    }
}
function nutrition_guard_check_token_budget(array $state,array $policy,string $kind,int $additionalTokens,int $now): void {
    $additionalTokens=max(0,$additionalTokens);$pending=nutrition_guard_pending_tokens($state);$pendingKind=nutrition_guard_pending_tokens($state,$kind);
    foreach([[60,'tokens_minute','guard_tokens_minute'],[3600,'tokens_hour','guard_tokens_hour'],[86400,'tokens_day','guard_tokens_day']] as [$window,$key,$code]){
        $limit=(int)($policy[$key]??0);if($limit<1)continue;$used=nutrition_guard_safe_add_int(nutrition_guard_sum_tokens($state['tokens'],$now,(int)$window),$pending);
        if(nutrition_guard_budget_exceeded($used,$additionalTokens,$limit))nutrition_guard_throw_limit($code,max(nutrition_guard_retry_after($state['tokens'],$now,(int)$window),nutrition_guard_inflight_retry_after($state,$now)),'Защитный бюджет токенов Gemini временно исчерпан. Основной расчёт доступен без AI.');
    }
    $kindPolicy=is_array($policy['kind_tokens'][$kind]??null)?$policy['kind_tokens'][$kind]:[];
    foreach([[60,'minute'],[3600,'hour'],[86400,'day']] as [$window,$key]){
        $limit=(int)($kindPolicy[$key]??0);if($limit<1)continue;$used=nutrition_guard_safe_add_int(nutrition_guard_sum_tokens($state['tokens'],$now,(int)$window,$kind),$pendingKind);
        if(nutrition_guard_budget_exceeded($used,$additionalTokens,$limit))nutrition_guard_throw_limit('guard_'.$kind.'_tokens_'.$key,max(nutrition_guard_retry_after($state['tokens'],$now,(int)$window,$kind),nutrition_guard_inflight_retry_after($state,$now,$kind)),'Бюджет токенов этой AI-функции временно исчерпан; другие функции и локальный расчёт остаются доступными.');
    }
}
function nutrition_guard_begin(string $kind, int $estimatedTokens): string {
    if (!in_array($kind, ['explain','planner','media'], true)) $kind = 'explain';
    $kill = nutrition_guard_kill_switch();
    if ($kill['disabled']) {
        $message=str_starts_with((string)$kill['code'],'guard_pricing_review_')
            ? 'Gemini остановлен до повторной проверки актуальных тарифов и локальных денежных лимитов. Основной локальный расчёт продолжает работать.'
            : 'Gemini временно отключён серверным аварийным переключателем. Основной локальный расчёт продолжает работать.';
        throw new GeminiApiException($message, 503, 60, true, (string)$kill['code'], 0);
    }
    $estimatedTokens = max(500, min(1000000, $estimatedTokens));
    $identity = nutrition_guard_identity();$policy = nutrition_guard_policy();
    try {
        $leaseId = nutrition_guard_with_state(function(array &$state) use ($kind,$estimatedTokens,$identity,$policy): string {
            $now=time();$circuit=nutrition_guard_circuit_status($state,$policy,$now);
            if($circuit['open'])nutrition_guard_throw_limit($circuit['code'],(int)$circuit['retry_after'],'Gemini временно поставлен на паузу после серии ошибок провайдера. Локальные функции калькулятора продолжают работать.');
            $globalInflight=count($state['inflight']);$clientInflight=0;foreach($state['inflight'] as $lease)if(is_array($lease)&&($lease['client']??'')===$identity['client'])$clientInflight++;
            if($clientInflight>=(int)$policy['client_concurrency'])nutrition_guard_throw_limit('guard_client_concurrency',3,'Для этого клиента уже выполняется AI-запрос. Дождитесь его завершения.');
            if($globalInflight>=(int)$policy['global_concurrency'])nutrition_guard_throw_limit('guard_global_concurrency',3,'Все разрешённые серверные AI-слоты сейчас заняты. Повторите запрос немного позже.');
            nutrition_guard_check_action_limit($state,$policy['actions'][$kind],$kind,$identity,$now);
            nutrition_guard_check_token_budget($state,$policy,$kind,$estimatedTokens,$now);
            $estimatedCost=nutrition_guard_estimated_cost_micro_usd($estimatedTokens);
            nutrition_guard_check_cost_budget($state,$policy,$kind,$estimatedCost,$now);
            $leaseId=bin2hex(random_bytes(16));
            $state['actions'][]=['ts'=>$now,'kind'=>$kind,'client'=>$identity['client'],'subnet'=>$identity['subnet']];
            $state['inflight'][$leaseId]=['kind'=>$kind,'client'=>$identity['client'],'subnet'=>$identity['subnet'],'started_at'=>$now,'expires_at'=>$now+NUTRITION_GUARD_LEASE_TTL_SECONDS,'estimated_tokens_per_attempt'=>$estimatedTokens,'pending_tokens'=>$estimatedTokens,'actual_tokens'=>0,'estimated_cost_micro_usd_per_attempt'=>$estimatedCost,'pending_cost_micro_usd'=>$estimatedCost,'actual_cost_micro_usd'=>0,'provider_attempts'=>0,'active_attempt'=>false,'active_model'=>''];
            return$leaseId;
        });
        $GLOBALS['NUTRITION_GEMINI_GUARD_LEASE']=$leaseId;return$leaseId;
    }catch(GeminiApiException $error){throw$error;}catch(Throwable $error){throw nutrition_guard_storage_exception($error);}
}
function nutrition_guard_before_provider_attempt(string $model): void {
    $leaseId=(string)($GLOBALS['NUTRITION_GEMINI_GUARD_LEASE']??'');if($leaseId==='')throw new GeminiApiException('Вызов Gemini остановлен: отсутствует защитная аренда операции.',503,60,false,'guard_lease_missing',0);$policy=nutrition_guard_policy();
    try{
        nutrition_guard_with_state(function(array &$state)use($leaseId,$model,$policy):void{
            $now=time();$lease=$state['inflight'][$leaseId]??null;if(!is_array($lease))throw new GeminiApiException('Защитная аренда AI-запроса истекла. Повторите операцию.',429,3,true,'guard_lease_expired',0);
            if(!empty($lease['active_attempt']))throw new RuntimeException('guard_attempt_not_settled');
            $kind=(string)($lease['kind']??'explain');$attempts=(int)($lease['provider_attempts']??0);
            if($attempts>=(int)($policy['max_attempts'][$kind]??1))nutrition_guard_throw_limit('guard_operation_attempt_budget',30,'Защитный предел обращений к провайдеру для одной операции исчерпан. Повторите позже.');
            foreach([[60,$policy['provider_attempts_minute'],'guard_provider_attempts_minute'],[600,$policy['provider_attempts_10m'],'guard_provider_attempts_10m'],[3600,$policy['provider_attempts_hour'],'guard_provider_attempts_hour'],[86400,$policy['provider_attempts_day'],'guard_provider_attempts_day']]as[$window,$limit,$code]){
                if(nutrition_guard_count($state['attempts'],$now,(int)$window)>=(int)$limit)nutrition_guard_throw_limit($code,nutrition_guard_retry_after($state['attempts'],$now,(int)$window),'Серверный защитный бюджет обращений к Gemini временно исчерпан.');
            }
            $estimate=max(500,(int)($lease['estimated_tokens_per_attempt']??500));$estimatedCost=max(1,(int)($lease['estimated_cost_micro_usd_per_attempt']??nutrition_guard_estimated_cost_micro_usd($estimate)));
            if($attempts>0){nutrition_guard_check_token_budget($state,$policy,$kind,$estimate,$now);nutrition_guard_check_cost_budget($state,$policy,$kind,$estimatedCost,$now);$state['inflight'][$leaseId]['pending_tokens']=nutrition_guard_safe_add_int(max(0,(int)($lease['pending_tokens']??0)),$estimate);$state['inflight'][$leaseId]['pending_cost_micro_usd']=nutrition_guard_safe_add_int(max(0,(int)($lease['pending_cost_micro_usd']??0)),$estimatedCost);}
            $state['attempts'][]=['ts'=>$now,'kind'=>$kind,'client'=>$lease['client'],'model'=>substr(hash('sha256',$model),0,12)];
            $state['inflight'][$leaseId]['provider_attempts']=$attempts+1;$state['inflight'][$leaseId]['active_attempt']=true;$state['inflight'][$leaseId]['active_model']=substr($model,0,100);$state['inflight'][$leaseId]['expires_at']=$now+NUTRITION_GUARD_LEASE_TTL_SECONDS;
        });
    }catch(GeminiApiException $error){throw$error;}catch(Throwable $error){throw nutrition_guard_storage_exception($error);}
}
function nutrition_guard_settle_active_attempt(array &$state,string $leaseId,int $chargedTokens,bool $estimated,string $reason,array $details=[]): void {
    $lease=$state['inflight'][$leaseId]??null;if(!is_array($lease))throw new RuntimeException('guard_usage_lease_missing');if(empty($lease['active_attempt']))throw new RuntimeException('guard_attempt_not_active');
    $estimate=max(500,(int)($lease['estimated_tokens_per_attempt']??500));$estimatedCost=max(1,(int)($lease['estimated_cost_micro_usd_per_attempt']??nutrition_guard_estimated_cost_micro_usd($estimate)));$now=time();
    $state['inflight'][$leaseId]['pending_tokens']=max(0,(int)($lease['pending_tokens']??0)-$estimate);$state['inflight'][$leaseId]['pending_cost_micro_usd']=max(0,(int)($lease['pending_cost_micro_usd']??0)-$estimatedCost);$state['inflight'][$leaseId]['active_attempt']=false;$state['inflight'][$leaseId]['expires_at']=$now+NUTRITION_GUARD_LEASE_TTL_SECONDS;
    if($chargedTokens>0){$row=array_merge(['ts'=>$now,'kind'=>$lease['kind'],'prompt'=>0,'output'=>0,'thoughts'=>0,'tool_use'=>0,'cached'=>0,'total'=>$chargedTokens,'estimated'=>$estimated,'reason'=>substr($reason,0,60),'model'=>substr(hash('sha256',(string)($lease['active_model']??'')),0,12)],$details);$state['tokens'][]=$row;$cost=nutrition_guard_actual_cost_micro_usd($row,$chargedTokens,$estimated);$state['costs'][]=['ts'=>$now,'kind'=>$lease['kind'],'micro_usd'=>$cost,'estimated'=>$estimated,'reason'=>substr($reason,0,60),'model'=>$row['model']];$state['inflight'][$leaseId]['actual_tokens']=nutrition_guard_safe_add_int((int)($lease['actual_tokens']??0),$chargedTokens);$state['inflight'][$leaseId]['actual_cost_micro_usd']=nutrition_guard_safe_add_int((int)($lease['actual_cost_micro_usd']??0),$cost);}
}
function nutrition_guard_record_ambiguous_attempt(string $reason='ambiguous_provider_outcome'): void {
    $leaseId=(string)($GLOBALS['NUTRITION_GEMINI_GUARD_LEASE']??'');if($leaseId===''){nutrition_guard_mark_integrity_failure('ambiguous_accounting_lease_missing');throw new GeminiApiException('Неоднозначно завершившийся вызов Gemini не связан с защитной арендой. AI заблокирован до проверки.',503,60,true,'guard_ambiguous_accounting_failed',0);}
    try{nutrition_guard_with_state(function(array &$state)use($leaseId,$reason):void{$lease=$state['inflight'][$leaseId]??null;if(!is_array($lease))throw new RuntimeException('guard_ambiguous_lease_missing');$estimate=max(500,(int)($lease['estimated_tokens_per_attempt']??500));nutrition_guard_settle_active_attempt($state,$leaseId,$estimate,true,$reason);});}
    catch(Throwable $error){nutrition_guard_mark_integrity_failure('ambiguous_accounting_'.$error->getMessage());throw new GeminiApiException('Сервер не смог надёжно учесть неоднозначно завершившийся вызов Gemini. AI заблокирован до проверки защитного хранилища.',503,60,true,'guard_ambiguous_accounting_failed',0);}
}
function nutrition_guard_release_attempt_reservation(string $reason='provider_rejected_without_usage'): void {
    $leaseId=(string)($GLOBALS['NUTRITION_GEMINI_GUARD_LEASE']??'');if($leaseId==='')throw new GeminiApiException('Освобождение резерва невозможно: отсутствует защитная аренда.',503,60,false,'guard_lease_missing',0);
    try{nutrition_guard_with_state(function(array &$state)use($leaseId,$reason):void{nutrition_guard_settle_active_attempt($state,$leaseId,0,false,$reason);});}
    catch(Throwable $error){throw nutrition_guard_storage_exception($error);}
}
function nutrition_guard_usage_values(mixed $usage): array {
    $u=is_array($usage)?$usage:[];$get=static function(array $keys)use($u):int{foreach($keys as$k)if(isset($u[$k])&&is_numeric($u[$k]))return max(0,(int)$u[$k]);return 0;};
    $prompt=$get(['promptTokenCount','prompt_token_count','totalInputTokens','total_input_tokens']);$output=$get(['candidatesTokenCount','candidates_token_count','totalOutputTokens','total_output_tokens']);$thoughts=$get(['thoughtsTokenCount','thoughts_token_count','totalThoughtTokens','total_thought_tokens']);$tool=$get(['toolUsePromptTokenCount','tool_use_prompt_token_count','totalToolUseTokens','total_tool_use_tokens']);$cached=$get(['cachedContentTokenCount','cached_content_token_count','totalCachedTokens','total_cached_tokens']);$total=$get(['totalTokenCount','total_token_count','totalTokens','total_tokens']);if($total<=0)$total=$prompt+$output+$thoughts+$tool;
    return['prompt'=>$prompt,'output'=>$output,'thoughts'=>$thoughts,'tool_use'=>$tool,'cached'=>$cached,'total'=>$total];
}
function nutrition_guard_record_usage(mixed $usage): void {
    $leaseId=(string)($GLOBALS['NUTRITION_GEMINI_GUARD_LEASE']??'');if($leaseId===''){nutrition_guard_mark_integrity_failure('usage_accounting_lease_missing');throw new GeminiApiException('Ответ Gemini не связан с защитной арендой. AI заблокирован до проверки защитного хранилища.',503,60,true,'guard_usage_accounting_failed',0);}$values=nutrition_guard_usage_values($usage);
    try{
        nutrition_guard_with_state(function(array &$state)use($leaseId,$values):void{
            $lease=$state['inflight'][$leaseId]??null;if(!is_array($lease))throw new RuntimeException('guard_usage_lease_missing');$accounted=$values;$estimated=false;
            if($accounted['total']<=0){$estimated=true;$accounted=['prompt'=>0,'output'=>0,'thoughts'=>0,'tool_use'=>0,'cached'=>0,'total'=>max(500,(int)($lease['estimated_tokens_per_attempt']??500))];}
            nutrition_guard_settle_active_attempt($state,$leaseId,$accounted['total'],$estimated,$estimated?'missing_usage_metadata':'provider_usage_metadata',['prompt'=>$accounted['prompt'],'output'=>$accounted['output'],'thoughts'=>$accounted['thoughts'],'tool_use'=>$accounted['tool_use'],'cached'=>$accounted['cached']]);
        });
    }catch(Throwable $error){nutrition_guard_mark_integrity_failure('usage_accounting_'.$error->getMessage());error_log('[nutrition-gemini-guard] usage accounting failure: '.preg_replace('/[^A-Za-z0-9_.:-]/','_',$error->getMessage()));throw new GeminiApiException('Ответ Gemini получен, но сервер не смог надёжно учесть фактическое использование токенов. AI заблокирован до проверки защитного хранилища.',503,60,true,'guard_usage_accounting_failed',0);}
}
function nutrition_guard_cleanup_logs(array $paths, array $policy): void {
    $dir=dirname($paths['log']);$cutoff=time()-max(1,(int)($policy['log_retention_days']??14))*86400;
    foreach (glob($dir.'/events-*.jsonl') ?: [] as $file) {
        if (!is_file($file) || $file===$paths['log']) continue;
        $mtime=@filemtime($file);if(is_int($mtime)&&$mtime<$cutoff)@unlink($file);
    }
}
function nutrition_guard_safe_log(array $event): void {
    if (!nutrition_guard_env_bool('NUTRITION_GEMINI_GUARD_LOG', true)) return;
    try {
        $paths = nutrition_guard_paths();$policy=nutrition_guard_policy();nutrition_guard_cleanup_logs($paths,$policy);
        $line = json_encode($event, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (!is_string($line)) return;
        $size=is_file($paths['log'])?@filesize($paths['log']):0;if(is_int($size)&&$size>=(int)($policy['log_max_bytes']??5242880))return;
        $fh = @fopen($paths['log'], 'ab');
        if (!$fh) return;
        if (@flock($fh, LOCK_EX)) { @fwrite($fh, $line."\n"); @flock($fh, LOCK_UN); }
        fclose($fh); @chmod($paths['log'], 0600);
    } catch (Throwable) {}
}
function nutrition_guard_finish(bool $success, string $errorCode = '', int $retryAfter = 0, bool $retryable = false, bool $providerVerified = true): void {
    $leaseId = (string)($GLOBALS['NUTRITION_GEMINI_GUARD_LEASE'] ?? '');
    unset($GLOBALS['NUTRITION_GEMINI_GUARD_LEASE']);
    if ($leaseId === '') return;
    try {
        $summary = nutrition_guard_with_state(function(array &$state) use ($leaseId,$success,$errorCode,$retryAfter,$retryable,$providerVerified): array {
            $lease = $state['inflight'][$leaseId] ?? null;
            if (!is_array($lease)) return [];
            if (!empty($lease['active_attempt'])) {
                $estimate=max(500,(int)($lease['estimated_tokens_per_attempt']??500));
                nutrition_guard_settle_active_attempt($state,$leaseId,$estimate,true,'finish_with_unsettled_attempt');
                $lease=$state['inflight'][$leaseId]??$lease;
            }
            unset($state['inflight'][$leaseId]);
            $now = time();
            if ($success && $providerVerified) {
                // Only a verified provider response closes the rolling failure circuit. Cache hits and
                // local short-circuits must not erase evidence of provider instability.
                $state['failures'] = [];
            } elseif ($errorCode !== '' && !str_starts_with($errorCode, 'guard_') && !str_starts_with($errorCode, 'ai_kill_switch')) {
                $state['failures'][] = ['ts'=>$now,'kind'=>$lease['kind'],'error_code'=>substr($errorCode,0,80),'retryable'=>$retryable];
                if (str_starts_with($errorCode, 'rate_limit_')) $state['provider_backoff_until'] = max((int)($state['provider_backoff_until'] ?? 0), $now + max(30, min(3600, $retryAfter ?: 60)));
            }
            return ['ts'=>gmdate('c',$now),'kind'=>$lease['kind'],'outcome'=>$success?($providerVerified?'success':'cache_hit'):'failure','error_code'=>substr($errorCode,0,80),'retry_after'=>max(0,$retryAfter),'client_ref'=>substr((string)$lease['client'],0,16),'subnet_ref'=>substr((string)$lease['subnet'],0,16),'provider_attempts'=>(int)($lease['provider_attempts']??0),'tokens'=>(int)($lease['actual_tokens']??0),'cost_micro_usd'=>(int)($lease['actual_cost_micro_usd']??0)];
        });
        if ($summary) nutrition_guard_safe_log($summary);
    } catch (Throwable $error) {
        error_log('[nutrition-gemini-guard] finish failure: '.preg_replace('/[^A-Za-z0-9_.:-]/', '_', $error->getMessage()));
    }
}
function nutrition_guard_estimate_tokens(string $kind,int $payloadBytes=0,int $mediaBytes=0,int $mediaFiles=0,int $audioFiles=0,int $imageFiles=0,int $maxOutputTokens=0,int $modalityTokenReserve=0): int {
    $payloadBytes=max(0,$payloadBytes);$mediaBytes=max(0,$mediaBytes);$mediaFiles=max(0,$mediaFiles);$audioFiles=max(0,min($mediaFiles,$audioFiles));$imageFiles=max(0,min($mediaFiles-$audioFiles,$imageFiles));
    $output=$maxOutputTokens>0?$maxOutputTokens:($kind==='media'?5200:($kind==='planner'?1300:1500));
    // A token cannot require fewer than one serialized byte. Reserving one token per byte also
    // covers schemas and system instructions without relying on language-specific averages.
    $textInput=max($kind==='media'?20000:8000,$payloadBytes);
    // Gemini 3.5 Flash has a 65,536-token output limit. LOW thinking normally uses far less,
    // but the full ceiling is reserved so concurrent requests cannot overshoot on rare cases.
    $thinkingReserve=65536;
    if($kind==='media'){
        $unknown=max(0,$mediaFiles-$audioFiles-$imageFiles);
        $modality=$modalityTokenReserve>0?$modalityTokenReserve:($imageFiles*65536+$audioFiles*65536+$unknown*65536);
        $modality=max($modality,$mediaFiles>0?3000:(int)ceil($mediaBytes/1024));
        return min(1000000,$textInput+$modality+$output+$thinkingReserve);
    }
    return min(1000000,$textInput+$output+$thinkingReserve);
}
function nutrition_guard_status_from_state(array $state,int $now): array {
    $policy=nutrition_guard_policy();$blockers=[];
    $circuit=nutrition_guard_circuit_status($state,$policy,$now);
    if($circuit['open'])$blockers[]=['code'=>$circuit['code'],'retry_after'=>(int)$circuit['retry_after']];
    foreach([[60,'provider_attempts_minute','guard_provider_attempts_minute'],[600,'provider_attempts_10m','guard_provider_attempts_10m'],[3600,'provider_attempts_hour','guard_provider_attempts_hour'],[86400,'provider_attempts_day','guard_provider_attempts_day']]as[$window,$key,$code]){
        if(nutrition_guard_count($state['attempts'],$now,(int)$window)>=(int)$policy[$key])$blockers[]=['code'=>$code,'retry_after'=>nutrition_guard_retry_after($state['attempts'],$now,(int)$window)];
    }
    foreach([[60,'tokens_minute','guard_tokens_minute'],[3600,'tokens_hour','guard_tokens_hour'],[86400,'tokens_day','guard_tokens_day']]as[$window,$key,$code]){
        if(nutrition_guard_sum_tokens($state['tokens'],$now,(int)$window)+nutrition_guard_pending_tokens($state)>=(int)$policy[$key])$blockers[]=['code'=>$code,'retry_after'=>max(nutrition_guard_retry_after($state['tokens'],$now,(int)$window),nutrition_guard_inflight_retry_after($state,$now))];
    }
    $costs=is_array($state['costs']??null)?$state['costs']:[];
    foreach([[60,'cost_micro_usd_minute','guard_cost_minute'],[3600,'cost_micro_usd_hour','guard_cost_hour'],[86400,'cost_micro_usd_day','guard_cost_day']]as[$window,$key,$code]){
        if(nutrition_guard_sum_cost($costs,$now,(int)$window)+nutrition_guard_pending_cost($state)>=(int)$policy[$key])$blockers[]=['code'=>$code,'retry_after'=>max(nutrition_guard_retry_after($costs,$now,(int)$window),nutrition_guard_inflight_retry_after($state,$now))];
    }
    if(!$blockers)return['available'=>true,'code'=>'','retry_after_seconds'=>0];
    usort($blockers,static fn(array $a,array $b):int=>$b['retry_after']<=>$a['retry_after']);
    return['available'=>false,'code'=>(string)$blockers[0]['code'],'retry_after_seconds'=>max(1,(int)$blockers[0]['retry_after'])];
}
function nutrition_guard_write_public_snapshot(array $state,array $paths): void {
    $now=time();$status=nutrition_guard_status_from_state($state,$now);
    $stateSize=@filesize($paths['state']);$stateMtime=@filemtime($paths['state']);
    $backupSize=@filesize($paths['backup']);$backupMtime=@filemtime($paths['backup']);
    $payload=json_encode([
        'schema'=>'p0_4_1_public_v2',
        'computed_at'=>$now,
        'available'=>$status['available'],
        'code'=>$status['code'],
        'retry_until'=>$status['available']?0:$now+(int)$status['retry_after_seconds'],
        'revision'=>max(0,(int)($state['revision']??0)),
        'state_size'=>is_int($stateSize)?$stateSize:-1,
        'state_mtime'=>is_int($stateMtime)?$stateMtime:-1,
        'backup_size'=>is_int($backupSize)?$backupSize:-1,
        'backup_mtime'=>is_int($backupMtime)?$backupMtime:-1,
    ],JSON_UNESCAPED_SLASHES);
    if(!is_string($payload))throw new RuntimeException('guard_public_status_encode_failed');
    nutrition_guard_atomic_write_file($paths['status'],$payload,'guard_public_status');
}
function nutrition_guard_read_public_snapshot(array $paths,int $now): ?array {
    if(!is_file($paths['status']))return null;
    $raw=@file_get_contents($paths['status']);$row=is_string($raw)?json_decode($raw,true):null;
    if(!is_array($row)||($row['schema']??'')!=='p0_4_1_public_v2'||!array_key_exists('available',$row))return null;
    $computedAt=(int)($row['computed_at']??0);if($computedAt>$now+NUTRITION_GUARD_CLOCK_SKEW_SECONDS)return['available'=>false,'code'=>'guard_clock_anomaly','retry_after_seconds'=>60];
    $size=@filesize($paths['state']);$mtime=@filemtime($paths['state']);
    $backupSize=@filesize($paths['backup']);$backupMtime=@filemtime($paths['backup']);
    if(!is_int($size)||!is_int($mtime)||!is_int($backupSize)||!is_int($backupMtime))return null;
    if($size!==(int)($row['state_size']??-1)||$mtime!==(int)($row['state_mtime']??-1))return null;
    if($backupSize!==(int)($row['backup_size']??-1)||$backupMtime!==(int)($row['backup_mtime']??-1))return null;
    $retryUntil=max(0,(int)($row['retry_until']??0));
    if(($row['available']??false)===true||$retryUntil<=$now)return['available'=>true,'code'=>'','retry_after_seconds'=>0];
    return['available'=>false,'code'=>substr((string)($row['code']??'guard_temporarily_unavailable'),0,80),'retry_after_seconds'=>max(1,$retryUntil-$now)];
}
function nutrition_guard_read_snapshot(): array {
    $paths=nutrition_guard_paths();
    $state=nutrition_guard_read_best_state($paths);
    if(!is_array($state)){
        if(is_file($paths['state'])||is_file($paths['backup']))throw new RuntimeException('guard_state_corrupt');
        $state=nutrition_guard_initial_state();
    }
    nutrition_guard_prune_state($state,time());
    return $state;
}
function nutrition_guard_public_status(): array {
    try { $kill = nutrition_guard_kill_switch(); }
    catch (Throwable $error) {
        error_log('[nutrition-gemini-guard] health kill-switch failure: '.preg_replace('/[^A-Za-z0-9_.:-]/', '_', $error->getMessage()));
        return ['available'=>false,'code'=>'guard_storage_unavailable','retry_after_seconds'=>5];
    }
    if ($kill['disabled']) return ['available'=>false,'code'=>$kill['code'],'retry_after_seconds'=>60];
    try {
        // Health checks use a compact atomically-written snapshot and never contend for
        // the writer lock. A full state read is only a corruption-safe fallback.
        $paths=nutrition_guard_paths();$now=time();$public=nutrition_guard_read_public_snapshot($paths,$now);
        if(is_array($public))return$public;
        return nutrition_guard_status_from_state(nutrition_guard_read_snapshot(),$now);
    } catch (Throwable $error) {
        error_log('[nutrition-gemini-guard] health failure: '.preg_replace('/[^A-Za-z0-9_.:-]/', '_', $error->getMessage()));
        return ['available'=>false,'code'=>'guard_storage_unavailable','retry_after_seconds'=>5];
    }
}
