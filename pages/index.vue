<template>
  <section>
    <div>

      <IconLink />
      <!-- <vue-plyr>
        <video ref="videoStreaming" controls crossorigin playsinline>
          <source src="">
        </video>
      </vue-plyr>  -->
    </div>
  </section>
</template>

<script>
import Logo from "~/components/Logo.vue";
import IconLink from "~/components/IconLink.vue";
import Hls from "hls.js";
import Plyr from "plyr";


export default {
  data() {
    return {
      playerOptions: {
        controls: [
          "play-large",
          "current-time",
          "play",
          "mute",
          "volume",
          "progress",
          "settings",
          "fullscreen"
        ],
        settings: ["quality", "speed", "loop"]
      }
    };
  },
  components: {
    Logo,
    IconLink
  },
  mounted() {
    this.videoStreaming();
  },
  methods: {
    videoStreaming() {
      var url = "http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8";
      // var mp4url = "blob:http://192.168.5.9:3000/4c154e05-4c96-4ef1-99b7-6c53f2af2c0a";
      const video = this.$refs.videoStreaming;
      console.log("tage video", video);
      const defaultOptions = {};
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          const availableQualities = hls.levels.map(l => l.height);
          defaultOptions.quality = {
            default: availableQualities[0],
            options: availableQualities,
            forced: true,
            onChange: e => updateQuality(e)
          };
          new Plyr(video, defaultOptions);
        });

        hls.attachMedia(video);
        window.hls = hls;
      } else {
        new Plyr(video, defaultOptions);
      }

      function updateQuality(newQuality) {
        window.hls.levels.forEach((level, levelIndex) => {
          if (level.height === newQuality) {
            console.log("Found quality match with " + newQuality);
            window.hls.currentLevel = levelIndex;
          }
        });
      }
    }
  }
};
</script>

<style scoped>
.title {
  font-family: "Quicksand", "Source Sans Pro", -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  display: block;
  font-weight: 400;
  font-size: 100px;
  color: #2E495E;
  letter-spacing: 1px;
  font-size: 6em;
}
.green {
  color: #00C48D;
}

.subtitle {
  font-weight: 300;
  font-size: 3em;
  color: #2E495E;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
