<template>
    <div class="player">       
       <PHeader :item="audioDetail" :isLogin="isLogin" :inBookShelf="inBookShelf"></PHeader>
       <section  class="play-warp">
            <div class="playDetailBtn" @click="goDetail">
                <i class="iconfont wf-detail"></i>
            </div>
            <!-- 播放主体-->
            <div class="playBox" >
                <div class="clip-path":class="{bounce:isPlaying}" >
                    <img :src="audioDetail.coverImg" style="width:100%">
                </div>
                <div class="bg_borderFFF"></div>
            </div>
            <div class="playTitle ta_c">
                <h3>第{{audioDetail.orderId}}章 | {{filterTitle}}</h3>
                <h4>主播：{{filterReaderName}}</h4>
            </div>
            <!-- 进度条 -->
            <div class="playBar-warp d-box">
                <span class="c_darkGray">{{progress}}</span>
                <div class="playBar b-flex"  @touchmove.prevent="handleMouse($event)"> 
                    <div class="bar" ref="progressTrack"> 
                        <span class="bar-unfill"> <span class="bar-fill" :style="{width:progressWidth}"></span> </span> 
                    </div> 
                    <i class="icon i-playIconC" :style="{left:progressLeft}"></i>
                </div>
                <span class="c_darkGray">{{totalPlayTime}}</span>
            </div>         
            <div class="playOperationBox">
                <ul class="d-box playBg_eee">
                    <li class="replayBtn b-flex">
                        <div>
                            <i class="iconfont wf-replay lightBlack" @click="onreload">
                            </i>
                        </div>
                    </li>                  
                    <li class="upBookBtn b-flex" id="prev" >
                        <div @click="loadPrevSong">
                            <i class="iconfont wf-Fastforward" :class="filterPrevClass"></i>
                        </div>
                    </li>
                    <li class="playBtn b-flex">
                        <div class="playBtn-Bg" v-if="isPlaying" @click="pause">
                            <div class="playBtn-Bb">        
                                <i class="iconfont wf-play lightBlue"></i>
                            </div>
                            <div class="playbuffer" v-if="isloading">
                                <img src="../../assets/images/playbuffer.png" :class="{bounce:isloading}">
                            </div>
                        </div>
                        <div class="playBtn-Bg" v-else @click="play">
                            <div class="playBtn-Bb"> 
                              <i class="iconfont wf-suspend lightBlue ml_8"></i>
                            </div>
                        </div>
                    </li>
                    <li class="downBookBtn b-flex" id="next">
                        <div @click="loadNextSong">
                            <i class="iconfont wf-slowMotion " :class="filterNextClass"></i>
                        </div>
                    </li>
                    <li class="CatalogBtn b-flex" id="catalog" >
                        <div @click="goCatalog">
                            <i class="iconfont wf-Catalog lightBlack" ></i>
                        </div>
                    </li>
                </ul>
            </div>          
        </section>
        <audio  id="mpostAudio"  :src="songUrl" autoplay="autoplay" preload="preload" controls="controls">
        </audio>
    </div>
</template>
<script type="text/javascript">
    
    import domready      from "domready"
    // import Audio         from 'PLUGINS/Audio'
    import Platform      from 'PLUGINS/Platform'
    import Confirm       from  'PLUGINS/Confirm'  
    import AudioUtil     from 'UTILS/audioUtil'
    import PHeader       from './_components/PHeader'
    import audioServices from 'SERVICES/audioServices'
    import Tips          from 'UTILS/tips'
    import Auth          from 'UTILS/auth'    
    import Purchase      from 'UTILS/purchase'
    import EventUtil     from 'UTILS/eventUtil'
    import {sessionStorage}    from 'UTILS/storageManager'
    const START_TIME = '00.00'

    export default {
        name: 'player',
        components:{PHeader},
        data() {
            return {
                orderId: 0,
                columnId: 1074555,
                currentAudio: {},              
                audioDetail:{}, 
                audio: null,
                songUrl: "http://cdn.cmread.com/file/660330378/5527c1c8a893e08405538b49b95e4305886f23135b50/32.mp3",
                isPlaying: true,
                totalPlayTime: START_TIME,
                progress: START_TIME,
                progressLeft: 0,
                progressWidth: 0,              
                isLogin: false,
                isloading:true,
                isAutoPlay: true,
                isLastChapter: 1,  //是否最后一章:0 是;1 否
                isAudioInit: false,
                isLocked: 1, //是否锁 0：锁定 1：未锁定
                currentPageNum: "",
                maxLength: 18,
                readerNameLength: 20,
                inBookShelf: 0,
                nextOrprev: 1,  //1：next; 0 prev
                ticktInterval: null,
                ticktSetTimeout: null
            }
        },        
        mounted() {
            this.$nextTick(function() {
                let query = this.$route.query;
            
                this.orderId  = query.oid;
                this.columnId = query.columnId;
                if (query.pageNum) {
                    this.currentPageNum = query.pageNum;
                }
                let mpostAudio = document.getElementById('mpostAudio');
                this.isLogin = Auth.checkLogin();
                this.queryAudioDetail();
                EventUtil.addEvent(mpostAudio, 'loadeddata', (mpostAudio)=>{
                    console.log('loadeddata');
                    this.isloading = true; 
                    this.isPlaying = false; 
                })
            
                EventUtil.addEvent(mpostAudio, 'playing', (mpostAudio)=>{
                    console.log('playing')
                    console.log('playing: '+ this.ticktInterval)
                    var self = this;

                    function startTick() {
                        console.log('in setInterval:'+self.ticktInterval)
                        self.whileplaying();
                        self.ticktInterval = setTimeout(startTick, 1000);
                    };
                    // this.ticktInterval = setTimeout(startTick, 1000);
                    startTick();
                    this.isloading = false; 
                    this.isPlaying = true; 
                })
                EventUtil.addEvent(mpostAudio, 'play', (mpostAudio)=>{
                    console.log('---------play--------')
                    this.isloading = false; 
                    this.isPlaying = true; 
                })
                var maxErrorLimit = 5;
                var count = 0;
                EventUtil.addEvent(mpostAudio, 'error', (mpostAudio)=>{
                    console.log('---------error--------')
                    
                    if (count!=0 && count <maxErrorLimit) {
                        count ++;
                        mpostAudio.play();
                    } else if(count == maxErrorLimit){
                        this.onLoadError();
                    }
                    setTimeout(()=> {
                        if (mpostAudio.play) {
                            mpostAudio.play();
                        }
                    },2000);
                })
                EventUtil.addEvent(mpostAudio, 'canplay', (mpostAudio)=>{
                   if (mpostAudio.play) {
                        setTimeout(()=> {
                            mpostAudio.play();
                        },2000);
                    }                 
                    console.log('---------canplay--------')
                })
                EventUtil.addEvent(mpostAudio, 'loadstart', (mpostAudio)=>{
                    console.log('---------loadstart--------')
                    this.isPlaying = false;
                    this.isloading = true;
                })
                EventUtil.addEvent(mpostAudio, 'progress', (mpostAudio)=>{
                    // console.log('---------progress--------')
                    // this.isloading = true;
                    // this.isPlaying = true;
                    // clearInterval(this.ticktInterval)                  
                })
                EventUtil.addEvent(mpostAudio, 'waiting', (mpostAudio)=>{
                    console.log('---------waiting--------')
                    this.isloading = true;
                    this.isPlaying = true;
                    clearTimeout(this.ticktInterval) 
                    this.ticktInterval = null;                 
                })
                EventUtil.addEvent(mpostAudio, 'pause', (mpostAudio)=>{
                    console.log('---------pause--------')
                    this.isPlaying = false;
                    clearTimeout(this.ticktInterval) 
                    this.ticktInterval = null;
                })
            });
        },
        methods: {
            domReady() {
                
                let self = this;
                //播放配置
                let soundManagerOptions = {
                    smOptions: {
                        debugMode: true //是否开启调试模式
                    }
                };

                domready(() => {
                    if (Platform.iOS) {
                        self.isPlaying = false;
                        self.isAutoPlay = false;
                    }              
                    this.isAudioInit = true;
                    var mpostAudio = document.getElementById('mpostAudio');
                    mpostAudio.play(); 
                })
            },
            pause() {
                var mpostAudio = document.getElementById('mpostAudio');
                    mpostAudio.pause(); 
                let audio = this.audio;   
                this.isPlaying = false;
                clearTimeout(this.ticktInterval);
                this.ticktInterval = null;
            },
            play() {  
                var mpostAudio = document.getElementById('mpostAudio');
                var playing = mpostAudio.currentTime > 0 && !mpostAudio.paused && !mpostAudio.ended 
    && mpostAudio.readyState > 2;
                
                if (!playing) {
                    mpostAudio.play();
                }

                // //自动播放
                // if (!this.isAutoPlay) {  
                //     this.isPlaying = true;
                //     this.isAutoPlay = true;
                //     mpostAudio.play();
                //     console.log('111')              
                //     return
                // } else {
                //     this.isPlaying = !this.isPlaying;
                //     // this.currentAudio.togglePause()
                //     mpostAudio.play();
                //     console.log('2222')
                //     // this.audio.play();
                // }
                // mpostAudio.play();
            },
            onSuspend () { //暂停               
                if (this.progressLeft !=100) {  //未加载完
                    // this.isloading = true;
                }
            },
            onreload() {  //重置
                let position = 0;
                let mpostAudio = document.getElementById('mpostAudio');
                this.progress = START_TIME;
                this.progressWidth = 0;
                this.progressLeft = 0;  
                this.isPlaying = true;
                
                clearTimeout(this.ticktInterval);
                this.ticktInterval = null;
                mpostAudio.pause();
                mpostAudio.src = mpostAudio.src;
                mpostAudio.currentTime = position
                var playing = mpostAudio.currentTime > 0 && !mpostAudio.paused && !mpostAudio.ended 
    && mpostAudio.readyState > 2;
                if (!playing) {
                    mpostAudio.play();
                    this.isPlaying = true;     
                }                         
            },
            onFinish() {
                console.log('播放结束---onFinish');
                this.isPlaying = false;
                this.loadNextSong();
            },
            onload () {
                //总时间直接用接口chapterTime
                let duration = this.audioDetail.chapterTime;
                this.totalPlayTime = AudioUtil.convertDurationTime(duration);
                this.isloading = false;
                console.log('加载完成onload duration:' + duration )
            },
            whileplaying (time) {  //播放中钩子方法

                let mpostAudio = document.getElementById('mpostAudio');
                let progressMaxLeft = 100, left, width;

                let position = time ||mpostAudio.currentTime ;
                let durationEstimate = this.audioDetail.chapterTime;

                left = Math.min(progressMaxLeft, Math.max(0, (progressMaxLeft * (position / durationEstimate)))) + '%';
                width = Math.min(100, Math.max(0, (100 * (position / durationEstimate)))) + '%';
                // console.log('position:'+position)
                // console.log('width:'+width)
                // console.log('left:'+left)
                //更新播放进度
                this.progressWidth = width;
                this.progressLeft = left;
                this.progress = AudioUtil.convertDurationTime(position);
            
                // if (this.isPlaying) {
                //     mpostAudio.click();
                // } else {
                //     mpostAudio.pause();
                // }
            },
            whileloading () {  //加载中钩子方法
                let mpostAudio = document.getElementById('mpostAudio');
                // let duration = mpostAudio.duration;
                // this.totalPlayTime = AudioUtil.convertDurationTime(duration);
                this.isloading = true;
            },
            handleMouse (e) { //拖动改变播放进度

                var target, barX, barWidth, x, clientX, newPosition, sound;
                var audioDetail = this.audioDetail;
                var  mpostAudio = document.getElementById('mpostAudio');

                target = this.$refs.progressTrack;
                barX = AudioUtil.getOffX(target);
                barWidth = target.offsetWidth;
                clientX = AudioUtil.getClientX(e);
                x = (clientX - barX);
                newPosition = (x / barWidth); 
                let currentTime = Number(audioDetail.chapterTime) * Number(newPosition);
                console.log('-----handleMouse-------')
           
                if (!mpostAudio) {
                    return;
                }

                let seekable = mpostAudio.seekable;
                let buffered = mpostAudio.buffered;
                console.log('seekable.end(0): ' +seekable.end(0))
                console.log('currentTime: '+currentTime)
                if (seekable.start(0) < currentTime && currentTime < seekable.end(0)) {
                    console.log('seekable.start(0) < currentTime < seekable.end(0)')
                    mpostAudio.currentTime = currentTime;
                    this.whileplaying();
                    if (this.isPlaying) {
                        mpostAudio.play();
                    }
                } else if (seekable.end(0) < currentTime) {
                    console.log('seekable.end(0) < currentTime')
                    
                    if ('fastSeek' in mpostAudio) {
                        console.log('-----------------fastSeek-------')
                        mpostAudio.fastSeek(audioDetail.chapterTime);
                        this.whileplaying(currentTime);
                        clearTimeout(this.ticktInterval);
                        if (!this.isPlaying) {
                            this.isloading = true;
                        }
                        mpostAudio.play();
                    } else {
                        currentTime = buffered.end(buffered.length-1)
                        mpostAudio.currentTime = buffered.end(buffered.length-1);
                        this.whileplaying(currentTime);
                        if (this.isPlaying) {
                            mpostAudio.play();
                        }
                    }
                } 
                return false;
            },
            queryAudioDetail(next) {
                
                let options = {
                    orderId: this.orderId,
                    columnId: this.columnId
                }
                
                options.callback = (results) => {
                    if(results.resultCode == 0) {

                        let body = results.body;
                        this.audioDetail = body;
                       
                        if (body) {
                            let duration = this.audioDetail.chapterTime;
                            this.totalPlayTime = AudioUtil.convertDurationTime(duration);
                            this.inBookShelf = body.inBookShelf;
                            if (body.isLocked == 0 ) { //收费
                                if (this.isLogin) {  //是否登录
                                    let param = {
                                        data: this.audioDetail
                                        // orderId: this.orderId,
                                        // columnId: this.columnId
                                    }
                                    //提示取消按钮事件
                                    param.cancel = () => {
                                        if (this.nextOrprev ==1 && this.orderId > 1) {  //next
                                            this.orderId --;
                                            console.log('cancel next')
                                        } else {  //prev
                                            if (this.isLastChapter==1){
                                                this.orderId ++;
                                                console.log('cancel prev')
                                            }
                                        }
                                        this.isPlaying = false;
                                        this.isloading = true;
                                        this.switchSong();
                                    }
                                    
                                    Purchase.subscribeAudioConfirm(param)
                                  
                                } else {  //未登录，转登录加提示
                                    Auth.goLogin(true);
                                }
                            } else {
                                this.songUrl = body.chapterurl;
                                this.isLastChapter = body.isLastChapter;
                                //是否初始化
                                if (!this.isAudioInit) { 
                                    this.domReady();
                                } 
                                if(next) {
                                    next()
                                }
                            }
                        } else {  //缺章或无内容情况
                            //nextOrprev 1：next; 0 prev
                            console.log(this.ticktSetTimeout)
                            let msg = '章节无内容，将自动收听下一章';
                            if (this.nextOrprev == 0 &&this.orderId > 1) {
                                msg = '章节无内容，将自动收听上一章';
                                this.ticktSetTimeout = setTimeout(() => {
                                    this.loadPrevSong ();
                                },2000);
                            } else {
                                this.ticktSetTimeout = setTimeout(() => {
                                    this.loadNextSong ();
                                },2000)                                
                            }
                            Tips.showTips({
                                type: 'error',
                                msg: msg,
                                showTime: 2000
                            })                           
                        }                      
                    } else {
                        Tips.showTips({
                            type: 'error',
                            msg: '操作失败，请稍后重试'
                        })
                    }
                };

                audioServices.queryAudioDetail(options);
            },
            loadPrevSong () {  //上一首
                if(this.orderId > 1) {
                    this.orderId --;
                    this.isPlaying = false;
                    this.isloading = true;
                    this.nextOrprev = 0;
                    this.switchSong();
                }
            },
            loadNextSong () {  //下一首                
                if (this.isLastChapter==1) {
                    this.orderId ++;
                    this.isPlaying = false;
                    this.isloading = true;
                    this.nextOrprev = 1;
                    this.switchSong();
                }
            },
            onLoadError () { //加载失败
                
                let self = this;
                let template = 'TT~第'+this.orderId+'章节播放失败，请另选章节收听';
                let confParams = {
                    template: template,
                    menuInfo: [{
                        value: "确认",
                        type: "warning",
                        event: function() {
                            self.goCatalog();
                            confrim.close();
                        }
                    }, {
                        value: "重试",
                        type: "normal",
                        event: function() {
                            self.onreload()
                            confrim.close();
                        }
                    }]
                }

                var confrim = new Confirm(confParams); 
            },
            switchSong (position) {
                let mpostAudio = document.getElementById('mpostAudio');
                mpostAudio.pause()
                this.queryAudioDetail(() => {
                    
                    position = position  || 0;
                    // this.totalPlayTime = START_TIME;
                    clearTimeout(this.ticktInterval);
                    this.progress = START_TIME;
                    this.progressWidth = 0;
                    this.progressLeft = 0;  
                    this.isPlaying = true;
                    mpostAudio.currentTime = position;
                    mpostAudio.play();
                    mpostAudio.src = this.songUrl;
                })
            },            
            goDetail () {  //进详情页
                this.$router.push({
                    name:'audiodetail',
                    query:{columnId:this.columnId}
                });
            },
            goCatalog () { //进目录页
                this.$router.push({
                    name: "audiocatalog",
                    query: {
                        columnId:this.columnId,
                        orderId: this.orderId,
                        pageNum: this.currentPageNum
                    }
                })
            }
        },
        computed: {
            filterNextClass () {
                if (this.isLastChapter==0) {
                    return 'c_e8e8e8'
                }
                return 'lightBlack'
            },
            filterPrevClass () {
                 
                if (this.orderId ==1) {
                    return 'c_e8e8e8'
                }
                return 'lightBlack'
            },
            filterTitle () {
                let title = this.audioDetail.title;
                if (!title) return;             
                let txt = title.slice(0, this.maxLength);
                
                if (title.length > this.maxLength) {
                    txt += '...';
                }
                return txt;
            },
            filterReaderName () {
                let readerName = this.audioDetail.readerName;
                
                if (!readerName) return;             
                let txt = readerName.slice(0, this.readerNameLength);
                
                if (readerName.length > this.readerNameLength) {
                    txt += '...';
                }
                return txt;
                
            }
        },
        destroyed () { 
            clearTimeout(this.ticktInterval); 
            clearTimeout(this.ticktSetTimeout);
            this.ticktInterval = null;
        }
    }
</script>
<style type="text/css">
   .bounce {
      animation: bounce-in 5s linear infinite;
    }
  
    @keyframes bounce-in {
        0% {
          transform: rotate(0deg);
        }    
        100% {
           transform: rotate(360deg);
        }
    }
</style>