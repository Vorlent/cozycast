package com.github.vorlent.cozycastserver;

import org.kurento.client.IceCandidate;
import org.kurento.client.MediaPipeline;
import org.kurento.client.PlayerEndpoint;
import org.kurento.client.WebRtcEndpoint;
import org.kurento.client.RtpEndpoint;
import org.kurento.client.DispatcherOneToMany;

public class WorkerSession {

    private RtpEndpoint rtpEndpoint;
    private DispatcherOneToMany dispatcher;
    private MediaPipeline mediaPipeline;

    public WorkerSession() {
    }

    public RtpEndpoint getRtpEndpoint() {
        return rtpEndpoint;
    }

    public void setRtpEndpoint(RtpEndpoint rtpEndpoint) {
        this.rtpEndpoint = rtpEndpoint;
    }

    public DispatcherOneToMany getDispatcher() {
        return dispatcher;
    }

    public void setDispatcher(DispatcherOneToMany dispatcher) {
        this.dispatcher = dispatcher;
    }

    public MediaPipeline getMediaPipeline() {
        return mediaPipeline;
    }

    public void setMediaPipeline(MediaPipeline mediaPipeline) {
        this.mediaPipeline = mediaPipeline;
    }

    public void release() {
        if(mediaPipeline != null) {
            this.mediaPipeline.release();
        }
    }
}
