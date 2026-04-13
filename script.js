document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('sampling-form');
    const resultContainer = document.getElementById('result-container');
    const nResult = document.getElementById('n-result');
    const errorMsg = document.getElementById('error-message');
    const warningMsg = document.getElementById('warning-message');

    // システムのメモリ上限の例 (Bigtableなどを想定)
    const MEMORY_LIMIT = 1000000; 

    // モード切り替えロジック
    const radioInputs = document.querySelectorAll('input[name="input_mode"]');
    const groupTimeRange = document.getElementById('group-time-range');
    const groupDuration = document.getElementById('group-duration');

    radioInputs.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'time_range') {
                groupTimeRange.style.display = 'block';
                groupTimeRange.classList.add('active');
                groupDuration.style.display = 'none';
                groupDuration.classList.remove('active');
            } else {
                groupTimeRange.style.display = 'none';
                groupTimeRange.classList.remove('active');
                groupDuration.style.display = 'block';
                groupDuration.classList.add('active');
            }
        });
    });

    const tStart = document.getElementById('t-start');
    const tEnd = document.getElementById('t-end');
    const deltaT = document.getElementById('delta-t');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 状態リセット
        nResult.textContent = '--';
        errorMsg.classList.remove('show');
        warningMsg.classList.remove('show');
        resultContainer.classList.add('show');
        
        // 送信時のマイクロアニメーション
        form.classList.add('calculating');
        
        // UIのフィードバックを感じさせるための若干の遅延
        setTimeout(() => {
            calculateSamples();
            form.classList.remove('calculating');
        }, 400); 
    });

    function calculateSamples() {
        const tStartVal = tStart.value;
        const tEndVal = tEnd.value;
        const deltaTVal = deltaT.value;
        const fsValueVal = document.getElementById('f-s-value').value;
        const fsUnitVal = document.getElementById('f-s-unit').value;

        // 1. サンプリング間隔を秒単位 (f_sec) に統一
        const fsValue = parseFloat(fsValueVal);
        if (isNaN(fsValue) || fsValue <= 0) {
            showError("サンプリング間隔は0より大きい数値を指定してください。");
            return;
        }
        const fSec = fsUnitVal === 'sec' ? fsValue : fsValue * 60;

        const currentMode = document.querySelector('input[name="input_mode"]:checked').value;

        // 2. 総観測時間 (T_total) の決定
        let tTotal = 0;
        
        if (currentMode === 'time_range') {
            if (!tStartVal || !tEndVal) {
                showError("開始時刻および終了時刻を入力してください。");
                return;
            }
            const startDate = new Date(tStartVal);
            const endDate = new Date(tEndVal);
            
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                showError("日時のフォーマットが不正です。");
                return;
            }
            
            const diffMs = endDate.getTime() - startDate.getTime();
            if (diffMs < 0) {
                showError("Invalid Time Range: 終了時刻は開始時刻より後である必要があります。");
                return;
            }
            
            tTotal = diffMs / 1000; // 秒に変換
        } else {
            if (!deltaTVal) {
                showError("時間幅 (Duration) を入力してください（例: 1:00）。");
                return;
            }
            
            let dt = 0;
            const parts = deltaTVal.split(':');
            
            if (parts.length >= 2) {
                // "1:00" = 1時間00分 として hh:mm[:ss] の形式で解析
                const h = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10);
                const s = parts.length === 3 ? parseInt(parts[2], 10) : 0;
                
                if (isNaN(h) || isNaN(m) || isNaN(s)) {
                    showError("時間幅のフォーマットが不正です。(例: 1:00 または 1:30:00)");
                    return;
                }
                dt = h * 3600 + m * 60 + s;
            } else {
                // コロンが含まれない場合は秒数として扱う
                dt = parseFloat(deltaTVal);
                if (isNaN(dt)) {
                    showError("時間幅は 1:00（hh:mm 形式）または秒数で入力してください。");
                    return;
                }
            }
            
            if (dt < 0) {
                showError("時間幅 (Duration) が不正です。");
                return;
            }
            tTotal = dt;
        }

        // 3. 合計数 (N) の算出
        const n = Math.floor(tTotal / fSec);

        // 4. 結果の出力
        nResult.textContent = n.toLocaleString();

        // メモリ上限の警告
        if (n > MEMORY_LIMIT) {
            showWarning(`警告: 算出されたサンプリング数 (${n.toLocaleString()}件) がシステムのメモリ上限を超過する可能性があります。ダウンサンプリングを推奨します。`);
        }
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.add('show');
        nResult.textContent = 'Error';
    }

    function showWarning(msg) {
        warningMsg.textContent = msg;
        warningMsg.classList.add('show');
    }
});
