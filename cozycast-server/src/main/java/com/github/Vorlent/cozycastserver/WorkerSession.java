package com.github.vorlent.cozycastserver;

import org.kurento.client.IceCandidate;
import org.kurento.client.MediaPipeline;
import org.kurento.client.PlayerEndpoint;
import org.kurento.client.WebRtcEndpoint;
import org.kurento.client.RtpEndpoint;

public class WorkerSession {

    private RtpEndpoint rtpEndpoint;

    public WorkerSession() {
    }

    public RtpEndpoint getRtpEndpoint() {
        return rtpEndpoint;
    }

    public void setRtpEndpoint(RtpEndpoint rtpEndpoint) {
        this.rtpEndpoint = rtpEndpoint;
    }
}
