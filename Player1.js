class Player1 {

    /**
     * 코드는 JAVASCRIPT 로 작성해 주시고, 위의 첫줄과 on...() 메소드의 이름은 변경하지 말아주세요.
     */
    
    /**
     * 플레이어의 이름 또는 닉네임을 입력해 주세요.
     * 그대로 두면 Player1 또는 Player2로 replace 됩니다.
     * player_name은 printLog 할때 누구의 로그인지를 구분하기 위해 사용할 수 있고,
     * Score Board에 표시됩니다.
     */
    player_name = "lauvsong";

    STRIKE = 0;
    BALL = 1;
    ANTA = 2;
    HOMERUN = 3;

    ball3_turn_cnt = 0;
    hit_cnt = 0;
    out_cnt = 0;

    is_offence = true;
    offence_target = null
    defense_ball3_target = [1,1];

    curr = null;
    prev = null;

    turn = 0;

    is_ball4_center_strategy = true;
    center_turn_cnt = 0;
    center_cnt = 0;
    center = [1,1];
    alternative_target = [2,1];

    // op_offence_choice = new Set();
    // op_defense_choice = new Set();

    /**
     * 게임이 시작되면 호출됩니다.
     * 게임 중에 사용할 변수들의 초기화를 여기서 합니다.
     */
    onGameStart() {
        // printLog(string)는 플레이 영역 하단의 게임 로그 영역에 텍스트를 출력하는 함수입니다.
        printLog(this.player_name+": onGameStart!");
    }

    /**
     * 라운드가 시작되면 호출됩니다.
     * 1번의 게임은 7번의 라운드를 실행합니다.
     * 1라운드는 야구 한 경기(9이닝)를 의미합니다.
     */
    onRoundStart() {
        printLog(this.player_name+": onRoundStart!");
    }

    /**
     * 턴이 시작되면 현재 상태(data)와 함께 호출되며,
     * 이번 턴에서 나의 선택이 무엇인지를 리턴해야 합니다.
     * 한번의 라운드에 대해 9이닝이 끝날때까지 턴이 반복됩니다.
     * 
     * @param data
     *   data.inning: 현재 이닝. 1~9
     *   data.is_offence: 공격/수비 여부. true:공격, false:수비
     *   data.ball_count: 볼카운트. {s:0, b:0, o:0}
     *   data.score: 현재 점수. {me:0, op:0}
     *   data.runner: 주자의 수. 0~3
     * 
     * @return [row, col]
     *   row: 0 or 1 or 2
     *   col: 0 or 1 or 2
     *   범위에서 벗어나는 좌표 또는 null 을 입력하면, 
     *   수비(투수)인 경우, 볼(ball)을 선택한 것으로,
     *   공격(타자)인 경우, 스윙하지 않은 것으로 간주합니다.
     */
    onTurnStart(data) {
        let result;

        this.curr = data;

        if (data.is_offence) {
            this.is_offence = true;
            result = this.attack(data)
        }
        else {
            this.is_offence = false;
            result = this.defense(data) 
        }

        this.turn++
        printLog(this.player_name+": onTurnStart! " + result);
        
        return result;
    }

    /**
     * 턴이 끝나면 호출되며, 턴의 결과를 받아봅니다.
     * 
     * @param result
     *   result.choice: {me:[0,0], op:[0,0]}
     *     범위를 벗어난 값이었다면 null로 옵니다.
     *   result.result: 0 or 1 or 2 or 3
     *     0: 스트라이크
     *     1: 볼
     *     2: 안타
     *     3: 홈런
     *   result.ball_count: 볼카운트. {s:0, b:0, o:0}
     *     o가 3이면 공수가 교대되어, 다음 onTurnStart() 호출시 리셋된 볼카운트 데이터가 전달됩니다.
     *   result.score: 현재 점수. {me:0, op:0}
     *   result.runner: 주자의 수. 0~3
     */
    onTurnEnd(result) {
        printLog(this.is_offence+" "+this.player_name+": onTurnEnd! choice:"+JSON.stringify(result.choice)+", result:"+result.result);
        printLog("strike: "+result.ball_count.s+" ball: "+result.ball_count.b+" out: "+result.ball_count.o);

        if (this.is_offence) 
            this.stat_offence(result);
        else
            this.stat_defense(result);

        this.prev = result;
    }

    /*치
     * 라운드가 끝나면 호출되며, 라운드의 결과를 받아봅니다.
     * @param result
     *   result.win: -1(졌을때) or 0(비겼을때) or 1(이겼을때)
     *   result.score: 현재 점수. {me:0, op:0}
     *   result.wincnt: 이긴 횟수
     *   result.losecnt: 진 횟수
     */
    onRoundEnd(result) {
        printLog(this.player_name+": onRoundEnd! win:"+result.win+", score:"+JSON.stringify(result.score));
        this.feedback_offence();
        this.feedback_defense();

        this.init_round();
    }

    /**
     * 게임이 끝나면 호출되며, 게임의 결과를 받아봅니다.
     * @param result
     *   result.win: -1(졌을때) or 0(비겼을때) or 1(이겼을때)
     */
    onGameEnd(result) {
        printLog(this.player_name+": onGameEnd! win:"+result.win);
    }

    isOut(data) {
        return (this.prev != null ) && ((data.ball_count.o == this.prev.ball_count.o + 1) || (data.ball_count.o == 0))
    }

    isFirstBall3(data) {
        return (data.ball_count.b == 3) && (this.prev != null) && (this.prev.result == this.BALL)
    }

    is3strike(data) {
        return (this.prev != null) && ((data.ball_count.o == this.prev.ball_count.o + 1) || (data.ball_count.o == 0))
    }

    isHit(result) {
        return (result.result == this.HOMERUN) || (result.result == this.ANTA)
    }

    init_round() {
        this.prev = null;
        this.hit_cnt = 0;
        this.out_cnt = 0;
        this.turn = 0;
        this.ball3_turn_cnt = 0;
        this.center_cnt = 0;
        this.center_turn_cnt = 0;
    }

    // # 공격 전략
    // 일단 안 치기.
    // 볼넷 직전 [1,1] 한번 선택해보기.
    // 실패 시 뒤로 안 치기.
    attack(data) {
        if (this.isFirstBall3(data) && this.is_ball4_center_strategy)
            return this.center;
        else 
            return this.offence_target;
        
    }

    // # 수비 전략
    // 일부러 볼셋, 그 뒤로 계속 [1,1]
    // - 볼셋까지 가기 전 타자가 헛스윙해서 3스트라이크 할 확률도..
    defense(data) {
        if (data.ball_count.b == 3) {
            return this.defense_ball3_target;
        } else
            return null;
    }

    // 3스트라이크 당한 횟수 산출
    stat_offence(result) {
        if (this.is3strike(result))
            this.out_cnt++;

        if (this.isFirstBall3(this.curr) && this.is_ball4_center_strategy) {
            this.center_turn_cnt++;

            if (this.isHit(result))
                this.center_cnt++;
        }
    }

    // 볼넷 당한 횟수 산출
    stat_defense(result) {
        if (this.prev == null)
            return;
        
        if (this.prev.ball_count.b != 3)
            return;

        if (this.isOut(result)) {
            this.ball3_turn_cnt++;

            if (result.result != this.STRIKE) {
                this.hit_cnt++;
            }
        }
    }

    /**
     * 라운드 공격 결과 피드백
     * - 삼진 아웃 비율 50% 이상일 시, 기본 좌표 [1,1]로 변경 
     */
    feedback_offence() {
        let out_rate = this.out_cnt / this.turn;
        printLog("out_rate: "+out_rate+" out_cnt: "+this.out_cnt+" turn: "+this.turn);

        this.offence_target = (0.5 < out_rate) ? this.center : null;

        let center_rate = this.center_cnt / this.center_turn_cnt;
        printLog("center_rate: "+center_rate+" center_cnt: "+this.center_cnt+" turn: "+this.center_turn_cnt)

        this.is_ball4_center_strategy = (0.5 < center_rate) ? true : false;

    }

    /**
     * 라운드 수비 결과 피드백
     * - 홈런/안타 비율 50% 이상일 시, 기본 좌표 [2,1]로 변경
     */
    feedback_defense() {
        let hit_rate = this.hit_cnt / this.ball3_turn_cnt;
        printLog("hit_rate: "+hit_rate+" hit_cnt: "+this.hit_cnt+" ball3_turn_cnt: "+this.ball3_turn_cnt);
        
        this.defense_ball3_target = (hit_rate < 0.5) ? this.center : this.alternative_target;
    }

}

// ## 피드백 전략
// 공격이면
// 1. onTurnEnd -> 3스트라이크 횟수, 전체 횟수 구하기
// 2. onRoundEnd -> 3스트라이크 / 전체 비율 50% 이상일 시, default_target [1,1]

// 수비면
// 1. onTurnEnd -> 홈런/안타 횟수, 볼넷 기회턴 횟수 구하기
// 2. onRoundEnd -> 홈런/안타 / 볼넷 기회 비율 50% 이상일 시, ball4_target [2,1]