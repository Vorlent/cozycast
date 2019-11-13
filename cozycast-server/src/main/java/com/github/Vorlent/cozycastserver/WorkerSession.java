package com.github.vorlent.cozycastserver;

import org.kurento.client.IceCandidate;
import org.kurento.client.MediaPipeline;
import org.kurento.client.PlayerEndpoint;
import org.kurento.client.WebRtcEndpoint;
import org.kurento.client.RtpEndpoint;
import org.kurento.client.KurentoClient;

public class WorkerSession {

    private RtpEndpoint rtpEndpoint;
    private MediaPipeline mediaPipeline;

    public WorkerSession() {
    }

    public RtpEndpoint getRtpEndpoint() {
        return rtpEndpoint;
    }

    public void setRtpEndpoint(RtpEndpoint rtpEndpoint) {
        this.rtpEndpoint = rtpEndpoint;
    }

    public MediaPipeline getMediaPipeline(KurentoClient kurento) {
        if(mediaPipeline == null) {
            mediaPipeline = kurento.createMediaPipeline();
        }
        return mediaPipeline;
    }


    public void release() {
        if(mediaPipeline != null) {
            this.mediaPipeline.release();
        }
    }
}
