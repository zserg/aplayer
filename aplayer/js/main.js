(function () {
    "use strict";
    //WinJS.log = console.log.bind(console);
    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var MediaPlayer = Windows.Media.Playback.MediaPlayer;
    var sessionState = WinJS.Application.sessionState;
    var search = Windows.Storage.Search;
    var localSettings = Windows.Storage.ApplicationData.current.localSettings;

    var isFirstActivation = true;
    var systemMediaControls = null;
    //var audtag = null;
    var filePath = null;
    var g_dispRequest = null;
    var mPlayer = null;
    var mPlayerSession = null;
    var dragInProgress = false;
    //var playPos = 0;
    var listView = null;
    var props = null;
    var myData = [];
    var slider = null;
    var db = null;
    var trackData = {};
    var filePlayed = null;
    var ONE_SECOND = 1000;
    var startBm = null;
    var endBm = null;
    var mode = null;
    var TRACK_TO_END = 0;
    var CHAPTER_TO_END = 1;
    var CHAPTER_CYCLE = 2;
    var autoplay = false;
    var lastPosition = 0;
    var restoreState = false;
    var pivot = null;
    var displayToggleSw = null;

    var butt_play = null;
    var butt_rew = null;

    var butt_mode = null;
    var appBar = null;
    var createDB = null;
    var mediaButtonPressed;
    var onPositionChanged;
    var ms2time;
    var getGroupKey;
    var getGroupData;
    var itemInvokedHandler;
    var sliderMouseDown;
    var sliderMouseUp;
    var changeMode;
    var playClickEv;
    var rewClickEv;
    var findPrevBookmark;
    var findNextBookmark;
    var createBookmark;
    var removeBookmark;
    var pivotSelectionChangedHandler;
    var displaySwitchHandler;
    var dbSuccess;
    var dbVersionUpgrade;
    var getFile;
    var readBookmarks;
    var updateTicks;
    var findChapter;
    var openAudioFromPath;
    var storeBookmark;
    var mplayerPlay;
    var mplayerPause;
    var sliderChange;
    var displayRequestHandler;
    var createLibrary;
    var updateLibrary;
    var groupedListView;
    var fileErrorHandler;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            // Активация Launch выполняется, когда пользователь запускает ваше приложение с помощью плитки
            // или вызывает всплывающее уведомление, щелкнув основной текст или коснувшись его.
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.running) {
                //WinJS.Utilities.startLog();
                createDB();
                systemMediaControls = Windows.Media.SystemMediaTransportControls.getForCurrentView();
                systemMediaControls.addEventListener("buttonpressed", mediaButtonPressed, false);
                systemMediaControls.isPlayEnabled = true;
                systemMediaControls.isPauseEnabled = true;
                systemMediaControls.playbackStatus = Windows.Media.MediaPlaybackStatus.paused;

                mPlayer = new MediaPlayer();
                mPlayer.autoPlay = false;
                mPlayerSession = mPlayer.playbackSession;
                mPlayerSession.addEventListener("positionchanged", onPositionChanged);
                mPlayerSession.addEventListener("naturaldurationchanged", function(){
                    slider.max = mPlayerSession.naturalDuration.toFixed(2);
                    });

                createLibrary();
            }
        }

        if (isFirstActivation) {
            args.setPromise(WinJS.UI.processAll().then(function () { console.log("processAll end");}));
            // Add your code to retrieve the button and register the event handler.
            console.log("AppBar setup start");
            appBar = document.getElementById("appbar").winControl;
            var cmd = document.getElementById("cmdBack");
            cmd.winControl.onclick = ("click", findPrevBookmark);
            cmd = document.getElementById("cmdForward");
            cmd.winControl.onclick = ("click", findNextBookmark);
            cmd = document.getElementById("cmdAdd");
            cmd.winControl.onclick = ("click", createBookmark);
            cmd = document.getElementById("cmdRemove");
            cmd.winControl.onclick = ("click", removeBookmark);
            cmd = document.getElementById("cmdPlay");
            cmd.winControl.onclick = ("click", playClickEv);
            cmd = document.getElementById("cmdRew");
            cmd.winControl.onclick = ("click", rewClickEv);
            cmd = document.getElementById("cmdSync");
            cmd.winControl.onclick = ("click", updateLibrary);

            pivot = document.getElementById("pivot");
            pivot.winControl.addEventListener("selectionchanged", pivotSelectionChangedHandler, false);

            var displayToggleSwith_div = document.getElementById("display-toggle-switch");
            displayToggleSw = new WinJS.UI.ToggleSwitch(displayToggleSwith_div, {title: "Display Turn-Off Disable"});
            displayToggleSwith_div.winControl.addEventListener("change", displaySwitchHandler, false);
            displayToggleSw.checked = localSettings.values.display;

                slider = document.getElementById("progress");
                slider.onpointerdown = sliderMouseDown;
                slider.onpointerup = sliderMouseUp;

                butt_mode = document.getElementById("butMode");
                butt_mode.style.backgroundImage = "url('/images/mode0_v2.svg')";
                butt_mode.addEventListener("click", changeMode, false);

                butt_play = document.getElementById("playbutton");
                butt_play.addEventListener("click", playClickEv, false);

                butt_rew = document.getElementById("rewbutton");
                butt_rew.addEventListener("click", rewClickEv, false);


                mode = CHAPTER_CYCLE;
                changeMode();
        }


        isFirstActivation = false;
    };



    app.oncheckpoint = function () {
        sessionState.filePath = filePath;
        localSettings.values.lastFile = filePath;
        localSettings.values.lastPosition = mPlayerSession.position;
    };

    app.onEnteredBackground = function () {
        sessionState.filePath = filePath;
        sessionState.tes = "hello";

    };

    createDB = function () {
        //WinJS.log && WinJS.log("createDB start", "IndexedDB", "info");
        // Create the request to open the database, named BookDB. If it doesn't exist, create it and immediately
        // upgrade to version 1.
        var dbRequest = window.indexedDB.open("PlayerDB", 1);

        // Add asynchronous callback functions
        dbRequest.onerror = function () { WinJS.log && WinJS.log("Error creating database.", "sample", "error");};
        dbRequest.onsuccess = function (evt) { dbSuccess(evt);};
        dbRequest.onupgradeneeded = function (evt) { dbVersionUpgrade(evt);};
        dbRequest.onblocked = function () { WinJS.log && WinJS.log("Database create blocked.", "sample", "error");};

    };

    // Whenever an IndexedDB is created, the version is set to "", but can be immediately upgraded by calling createDB.
    dbVersionUpgrade = function (evt) {
        db = evt.target.result;

        // Get the version update transaction handle, since we want to create the schema as part of the same transaction.
        var txn = evt.target.transaction;

        // Create the object store, with an index on the file path. Note that we set the returned object store to a variable
        // in order to make further calls (index creation) on that object store.
        if (!db.objectStoreNames.contains("tracks")) {
            db.createObjectStore("tracks", {keyPath: "path"});
        }

        // Once the creation of the object stores is finished (they are created asynchronously), log success.
        txn.oncomplete = function () { WinJS.log && WinJS.log("Database schema created.", "sample", "status");};
    };

    dbSuccess = function (evt) {
        db = evt.target.result;
        WinJS.log && WinJS.log("Database open success", "sample", "info");
        filePath = WinJS.Application.sessionState.filePath;
        if (filePath) {
            Windows.Storage.StorageFile.getFileFromPathAsync(sessionState.filePath).done(getFile);
        } else {
          filePath = localSettings.values.lastFile;
          lastPosition = localSettings.values.lastPosition;
          if (!lastPosition) {
              lastPosition = 0;
          }
          if (filePath){
            autoplay = false;
            restoreState = true;
            openAudioFromPath(filePath);
          }
        }

        };

    readBookmarks = function (trackKey) {
        WinJS.log && WinJS.log("readBookmarks start", "readData", "info");
        // Create a transaction with which to query the IndexedDB.
        var txn = db.transaction(["tracks"], "readonly");
        var objectStore = txn.objectStore("tracks");
        var request = objectStore.get(trackKey);

        // Set the event callbacks for the transaction.
        request.onerror = function () { WinJS.log && WinJS.log("Error reading data.", "readData", "error"); };
        request.onabort = function () { WinJS.log && WinJS.log("Reading of data aborted.", "readData", "error"); };

        request.onsuccess = function (e) {
          trackData = e.target.result;
          if(!trackData){
             trackData = {path: trackKey,
                          duration: mPlayerSession.naturalDuration,
                          bookmarks: []};
          }
          updateTicks();
          findChapter();
        };
    };

    updateTicks = function (){
          WinJS.log && WinJS.log(trackData.path, "updateTicks", "info");
          //var ss = String(mPlayerSession.naturalDuration)+"==" +String(trackData.duration);
          var bmNode = document.getElementById("bookmarks");
          while (bmNode.firstChild) {
                bmNode.removeChild(bmNode.firstChild);
          }

          trackData.bookmarks.forEach(function (item) {
            var tick = document.createElement("OPTION");
            tick.innerHTML = item.toFixed(0);
            bmNode.appendChild(tick);
          });
          slider.max = mPlayerSession.naturalDuration.toFixed(2);

    };


    createBookmark = function () {
        // Create a transaction with which to query the IndexedDB.
        WinJS.log && WinJS.log("createBookmark start", "createBookmark", "info");
        if(trackData.bookmarks){
            var txn = db.transaction(["tracks"], "readwrite");
            var objectStore = txn.objectStore("tracks");

            trackData.bookmarks.push(mPlayerSession.position);
            trackData.bookmarks.sort(function (a, b) { return a - b;});
            var request = objectStore.put(trackData);
            updateTicks();

            // Set the event callbacks for the transaction.
            txn.onerror = function () { WinJS.log && WinJS.log("transaction onerror", "createBookmark", "error"); };
            txn.onabort = function () { WinJS.log && WinJS.log("onabort", "createBookmark", "error"); };

            request.onsuccess = function () { WinJS.log && WinJS.log("success", "createBookmark", "info");};
            request.onerror = function () {WinJS.log && WinJS.log("request onerror", "createBookmark", "error");};
        }
    };

    storeBookmark = function () {
        // Create a transaction with which to query the IndexedDB.
        WinJS.log && WinJS.log("storeBookmark start", "storeBookmark", "info");
        console.log("storeBookmark");
        var txn = db.transaction(["tracks"], "readwrite");
        var objectStore = txn.objectStore("tracks");

        var request = objectStore.put(trackData);
        updateTicks();

        // Set the event callbacks for the transaction.
        txn.onerror = function () {
          //var err = txn;
           WinJS.log && WinJS.log("transaction onerror", "storeBookmark", "error"); };
        txn.onabort = function () { WinJS.log && WinJS.log("onabort", "storeBookmark", "error"); };

        request.onsuccess = function () { WinJS.log && WinJS.log("success", "storeBookmark", "info");};
        request.onerror = function () { WinJS.log && WinJS.log("request onerror", "storeBookmark", "error");};
    };

    removeBookmark = function () {
        var i;
      if(trackData.bookmarks){
        var cur_pos = mPlayerSession.position;
        var bmLength = trackData.bookmarks.length;
        startBm = null;
        endBm = null;
        for ( i=0; i< bmLength;i+=1){
          if(Math.abs(trackData.bookmarks[i] - cur_pos) < 0.03) {
              trackData.bookmarks.splice(i, 1);
          }
        }
        storeBookmark();
      }
   };

  itemInvokedHandler = function (eventObject) {
                eventObject.detail.itemPromise.done(function (invokedItem) {
                autoplay = true;
                openAudioFromPath(invokedItem.data.path, true);
                    // Access item data from the itemPromise
                var piv = document.getElementsByClassName("win-pivot");
                  var myPiv = piv[0];
                  myPiv.winControl.selectedIndex = 0;
                    WinJS.log && WinJS.log("The item at index " + invokedItem.index + " is "
                        + invokedItem.data.title + " with a text value of "
                        + invokedItem.data.text, "sample", "status");
                });
            };


    function openAudio(file) {
        if (file) {
            filePlayed = file;
            filePath = filePlayed.path;
            mPlayer.source = Windows.Media.Core.MediaSource.createFromStorageFile(filePlayed);
            if(restoreState){
                mPlayerSession.position = lastPosition;
                restoreState = false;
            }
            if (autoplay) {
                mplayerPlay();
            }
            //readBookmarks();// read bookmarks from IndexedDB
            slider.addEventListener("change", sliderChange, false);
            file.properties.getMusicPropertiesAsync().done(function (mprops){
              var title = mprops.title;
              var album = mprops.album;
              var artist = mprops.artist;
              var info_el = document.getElementById("track-info");
              info_el.innerHTML = "<p>"+title+"</p>"+"<p>"+artist+"</p>";
              var r_count_el = document.getElementById("couter-right");
              r_count_el.innerHTML = ms2time(mprops.duration);

              var trackKey = title+album+artist+mprops.duration;
              readBookmarks(trackKey);// read bookmarks from IndexedDB
            });

           file.getThumbnailAsync(
               Windows.Storage.FileProperties.ThumbnailMode.musicView,
               80,
               Windows.Storage.FileProperties.ThumbnailOptions.useCurrentScale).then(
                   function (thumbnail) {
                     if (thumbnail.size > 0) {
                        var imageBlob = window.URL.createObjectURL(thumbnail);
                        //document.getElementById("img").src = imageBlob;
                        document.getElementById("thumbnail").style.backgroundImage = "url('"+imageBlob+"')";
                     }
                   }
          );

        } else {
            updateLibrary();
            var piv = document.getElementsByClassName("win-pivot");
            var myPiv = piv[0];
            myPiv.winControl.selectedIndex = 2;
            WinJS.log && WinJS.log("Audio Tag Did Not Load Properly, Libary updated", "sample", "info");
        }

    }

    openAudioFromPath = function (filePath) {
            Windows.Storage.StorageFile.getFileFromPathAsync(filePath).then(openAudio, fileErrorHandler);
    };

    fileErrorHandler = function (file) {
        updateLibrary();
        var piv = document.getElementsByClassName("win-pivot");
        var myPiv = piv[0];
        myPiv.winControl.selectedIndex = 2;
        WinJS.log && WinJS.log("File not found, Library updated", "sample", "info");
    };

    getFile = function (file) {
            if (file) {
                mPlayer.source = Windows.Media.Core.MediaSource.createFromStorageFile(file);
            } else {
                WinJS.log && WinJS.log("Audio Tag Did Not Load Properly", "sample", "error");
            }

        };


    mediaButtonPressed = function (e) {
        switch (e.button) {
            case Windows.Media.SystemMediaTransportControlsButton.play:
                // Handle the Play event and print status to screen..
                WinJS.log && WinJS.log("Play Received", "sample", "status");
                mplayerPlay();
                break;

            case Windows.Media.SystemMediaTransportControlsButton.pause:
                // Handle the Pause event and print status to screen.
                WinJS.log && WinJS.log("Pause Received", "sample", "status");
                mplayerPause();
                break;

        }
    };


    onPositionChanged = function () {
      if(!dragInProgress){
         slider.value = mPlayerSession.position.toFixed(2);
         var l_count_el = document.getElementById("couter-left");
          l_count_el.innerHTML = ms2time(mPlayerSession.position);
          var r_count_el = document.getElementById("couter-right");
          r_count_el.innerHTML = ms2time(mPlayerSession.naturalDuration - mPlayerSession.position);
         var time = new Date();
         time.setTime((mPlayerSession.position).toFixed(0));
         if(mode === CHAPTER_TO_END && (endBm !== null) && (mPlayerSession.position > trackData.bookmarks[endBm])){
           mplayerPause();
           if(startBm !== null){
              mPlayerSession.position = trackData.bookmarks[startBm];
           }else{
              mPlayerSession.position = 0;
           }
         }else if(mode === CHAPTER_CYCLE && (endBm !== null) && (mPlayerSession.position > trackData.bookmarks[endBm])){
           if(startBm !== null){
              mPlayerSession.position = trackData.bookmarks[startBm];
           }else{
              mPlayerSession.position = 0;
           }
           mplayerPause();
           window.setTimeout(function () { mplayerPlay();}, 1000);
         }

      }
    };

    //function mediaPropertyChanged(e) {
    //    switch (e.property) {
    //        case Windows.Media.SystemMediaTransportControlsProperty.soundLevel:
    //            //Catch SoundLevel notifications and determine SoundLevel state.  If it's muted, we'll pause the player.
    //            var soundLevel = e.target.soundLevel;

    //            break;

    //        default:
    //            break;
    //    }
    //}

    // function audioPlaying() {
    //     systemMediaControls.playbackStatus = Windows.Media.MediaPlaybackStatus.playing;
    // };

    // function audioPaused() {
    //     systemMediaControls.playbackStatus = Windows.Media.MediaPlaybackStatus.paused;
    // };



  sliderMouseUp = function ()
    {
      dragInProgress = false;
    };

    sliderMouseDown = function () {
        dragInProgress = true;
    };

  sliderChange = function ()
    {
        mPlayerSession.position = slider.value;
        findChapter();
    };



  findPrevBookmark = function () {
      var i;
        if(trackData.bookmarks){
          var cur_pos = mPlayerSession.position;
          var new_pos = 0;
          var bmLength = trackData.bookmarks.length;
          for(i=0; i< bmLength;i+=1){
            if(trackData.bookmarks[i] < cur_pos && Math.abs(trackData.bookmarks[i]-cur_pos) > ONE_SECOND){
               new_pos = trackData.bookmarks[i]-0.01;
            }else{
              break;
            }
          }
          mPlayerSession.position = new_pos;
          findChapter();
        }
    };

  findNextBookmark = function () {
      var i;
        if(trackData.bookmarks){
          var cur_pos = mPlayerSession.position;
          var bmLength = trackData.bookmarks.length;
          for(i=0; i< bmLength;i+=1){
            if(trackData.bookmarks[i] > cur_pos) {
               mPlayerSession.position = trackData.bookmarks[i] + 0.01;
               break;
            }
          }
          findChapter();
        }
    };

    findChapter = function () {
        var cur_pos = mPlayerSession.position;
        var i;

      var bmLength = trackData.bookmarks.length;
      startBm = null;
      endBm = null;
      for(i=0; i< bmLength;i+=1){
        if(trackData.bookmarks[i] <= cur_pos) {
           startBm = i;
        }
        if(trackData.bookmarks[i] > cur_pos) {
           endBm = i;
           break;
        }
      }
      var chapB = document.getElementById("chapter-start");
      var chapE = document.getElementById("chapter-end");
      chapB.innerHTML = (startBm!==null ? startBm : "B");
      chapE.innerHTML = (endBm!==null ? endBm : "E");
    };



   changeMode = function (){
     if(mode === TRACK_TO_END){
       mode = CHAPTER_TO_END;
       butt_mode.style.backgroundImage = "url('/images/mode1_v2.svg')";
     }else if(mode === CHAPTER_TO_END){
       mode = CHAPTER_CYCLE;
       butt_mode.style.backgroundImage = "url('/images/mode2_v2.svg')";
     }else{
       mode = TRACK_TO_END;
       butt_mode.style.backgroundImage = "url('/images/mode0_v2.svg')";
     }
   };

   ms2time = function (ms){
     var x = Math.floor(ms/1000);
     var sec = x % 60;
     x = Math.floor(x/60);
     var min = x % 60;
     var hour = Math.floor(x/60);
     var str = hour + ":" +
       ((min < 10) ? ("0"+min) : min) +":"+
       ((sec<10) ? ("0"+sec) : sec);
     return str;
   };

   getGroupKey = function (dataItem){
      return dataItem.album;
   };

   getGroupData = function (dataItem){
      return {groupTitle: dataItem.album};
   };

    // compareGroups = function (left, right) {
    //     return left.toUpperCase().charCodeAt(0) - right.toUpperCase().charCodeAt(0);
    // };

  // Button Handlers
    playClickEv = function () {
        butt_play.classList.toggle("buttonActive");
        var cmd = appBar.getCommandById("cmdPlay");
        switch (mPlayerSession.playbackState) {
          case Windows.Media.Playback.MediaPlayerState.paused:
                // Handle the Play event and print status to screen..
                WinJS.log && WinJS.log("Play Received", "sample", "status");
                mplayerPlay();
                cmd.icon = "pause";
                cmd.label = "Pause";
                break;

          case Windows.Media.Playback.MediaPlayerState.playing:
                // Handle the Pause event and print status to screen.
                WinJS.log && WinJS.log("Pause Received", "sample", "status");
                mplayerPause();
                cmd.icon = "play";
                cmd.label = "Play";
                break;

        }
        window.setTimeout(function () {
           butt_play.classList.toggle("buttonActive");
        }, 200);
    };


    rewClickEv = function () {
         butt_rew.classList.toggle("buttonActive");
         mPlayerSession.position-=5000.0;
         if(mPlayerSession.playbackState === Windows.Media.Playback.MediaPlayerState.playing){
             mplayerPause();
             window.setTimeout(function () { mplayerPlay();}, 1000);
         }
         window.setTimeout(function () {
            butt_rew.classList.toggle("buttonActive");
         }, 200);
    };

    mplayerPlay = function () {
        var cmd = appBar.getCommandById("cmdPlay");
        cmd.icon = "pause";
        cmd.label = "Pause";
        mPlayer.play();
    };

    mplayerPause = function () {
        var cmd = appBar.getCommandById("cmdPlay");
        cmd.icon = "play";
        cmd.label = "Play";
        mPlayer.pause();
    };

    pivotSelectionChangedHandler = function (e){
      if (e.detail.index === 0){
        appBar.showOnlyCommands([
           "modeDiv",
           "cmdBack",
           "cmdForward",
           "cmdAdd",
           "cmdRemove",
           "cmdPlay",
           "cmdRew",
           "cmdPrev",
           "cmdNext"]);
      }else{
        appBar.showOnlyCommands(["cmdSync"]);
      }
      appBar.forceLayout();
    };

  displaySwitchHandler = function () {
      localSettings.values.display = displayToggleSw.checked;
      displayRequestHandler(displayToggleSw.checked);
  };

  displayRequestHandler = function (request){
      if (g_dispRequest === null) {
          g_dispRequest = new Windows.System.Display.DisplayRequest();
      }
      if (request) {
          g_dispRequest.requestActive();
      }else{
          g_dispRequest.requestRelease();
      }
  };

  createLibrary = function (){
        var queryOptions = new search.QueryOptions(search.CommonFileQuery.OrderByTitle, [".mp3"]);
        queryOptions.folderDepth = search.FolderDepth.deep;
        var query = Windows.Storage.KnownFolders.musicLibrary.createFileQueryWithOptions(queryOptions);
        var filePromises = [];
        myData = [];
        query.getFilesAsync().done(function (files) {
            // Get image properties
           files.forEach(function (file) {
              props = file.properties;
              myData.push({path:file.path, name:file.displayName});
              filePromises.push(props.getMusicPropertiesAsync());
              });

           Promise.all(filePromises).then(function (musicProperties){
                musicProperties.forEach(function (musicProp, ndx) {
                    myData[ndx].title = musicProp.title || myData[ndx].name;
                    myData[ndx].album = musicProp.album || "Unknown";
                    myData[ndx].artist = musicProp.artist || "Unknown";
                    myData[ndx].duration = ms2time(musicProp.duration);
                });
                createLibraryElements();

               var dataList = new WinJS.Binding.List(myData);
               listView.itemDataSource = dataList.dataSource;
               var groupedDataList = dataList.createGrouped(getGroupKey, getGroupData);
               groupedListView.groupDataSource = groupedDataList.groups.dataSource;
               groupedListView.itemDataSource = groupedDataList.dataSource;
               groupedListView.forceLayout();
               listView.forceLayout();

            });

        });
  };


  updateLibrary = function (){
        var queryOptions = new search.QueryOptions(search.CommonFileQuery.OrderByTitle, [".mp3"]);
        queryOptions.folderDepth = search.FolderDepth.deep;
        var query = Windows.Storage.KnownFolders.musicLibrary.createFileQueryWithOptions(queryOptions);
        var filePromises = [];
        myData = [];
        query.getFilesAsync().done(function (files) {
            // Get image properties
           files.forEach(function (file) {
              props = file.properties;
              myData.push({path:file.path, name:file.displayName});
              filePromises.push(props.getMusicPropertiesAsync());
              });

           Promise.all(filePromises).then(function (musicProperties){
                musicProperties.forEach(function (musicProp, ndx) {
                    myData[ndx].title = musicProp.title || myData[ndx].name;
                    myData[ndx].album = musicProp.album || "Unknown";
                    myData[ndx].artist = musicProp.artist || "Unknown";
                    myData[ndx].duration = ms2time(musicProp.duration);
                });

                var dataList = new WinJS.Binding.List(myData);
                var groupedDataList = dataList.createGrouped(getGroupKey, getGroupData);

                listView.itemDataSource = dataList.dataSource;
                groupedListView.groupDataSource = groupedDataList.groups.dataSource;
                groupedListView.itemDataSource = groupedDataList.dataSource;

                groupedListView.forceLayout();
                listView.forceLayout();

            });

        });
  };

  var getLibraryData = function (){
        var queryOptions = new search.QueryOptions(search.CommonFileQuery.OrderByTitle, [".mp3"]);
        queryOptions.folderDepth = search.FolderDepth.deep;
        var query = Windows.Storage.KnownFolders.musicLibrary.createFileQueryWithOptions(queryOptions);
        var filePromises = [];
        var myData = [];
        query.getFilesAsync().done(function (files) {
            // Get image properties
           files.forEach(function (file) {
              props = file.properties;
              myData.push({path:file.path, name:file.displayName});
              filePromises.push(props.getMusicPropertiesAsync());
              });

           Promise.all(filePromises).then(function (musicProperties){
                musicProperties.forEach(function (musicProp, ndx) {
                    myData[ndx].title = musicProp.title || myData[ndx].name;
                    myData[ndx].album = musicProp.album || "Unknown";
                    myData[ndx].artist = musicProp.artist || "Unknown";
                    myData[ndx].duration = ms2time(musicProp.duration);
                });

                var dataList = new WinJS.Binding.List(myData);
                var groupedDataList = dataList.createGrouped(getGroupKey, getGroupData);

                listView.itemDataSource = dataList.dataSource;
                groupedListView.groupDataSource = groupedDataList.groups.dataSource;
                groupedListView.itemDataSource = groupedDataList.dataSource;

                groupedListView.forceLayout();
                listView.forceLayout();

            });

        });
  };

  var createLibraryElements = function () {
     /* Track List Creating */
        var listDiv = document.querySelector("#myListView");  // Your html element on the page.
        listView = new WinJS.UI.ListView(listDiv, {layout: {type: WinJS.UI.ListLayout}});  // Declare a new list view by hand.
        var itemDiv = document.getElementById("mylisttemplate");  // Your template container
        listView.itemTemplate = itemDiv;  // Bind the list view to the element

     /* Albums List Creating */
        var groupedListDiv = document.querySelector("#myGroupedListView");  // Your html element on the page.
        groupedListView = new WinJS.UI.ListView(groupedListDiv, {layout: {type: WinJS.UI.ListLayout}});  // Declare a new list view by hand.
        var itemDivGrouped = document.getElementById("mygroupedlisttemplate");  // Your template container
        var headerDivGrouped = document.getElementById("mygroupedlistheadertemplate");  // Your template container
        groupedListView.itemTemplate = itemDivGrouped;  // Bind the list view to the element
        groupedListView.groupHeaderTemplate = headerDivGrouped;  // Bind the list view to the element

        //var groupedDataList = dataList.createGrouped(getGroupKey, getGroupData, compareGroups);
        groupedListDiv.winControl.addEventListener("iteminvoked", itemInvokedHandler, false);
        listDiv.winControl.addEventListener("iteminvoked", itemInvokedHandler, false);
  };


    app.start();
}());


