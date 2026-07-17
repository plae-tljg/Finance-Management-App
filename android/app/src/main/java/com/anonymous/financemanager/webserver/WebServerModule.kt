package com.anonymous.financemanager.webserver

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments

class WebServerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var server: FinanceHttpServer? = null
    private var pin: String? = null

    override fun getName(): String = "FinanceWebServer"

    @ReactMethod
    fun start(port: Double, pin: String?, promise: Promise) {
        try {
            stopInternal()
            val portInt = if (port <= 0 || port > 65535) FinanceHttpServer.DEFAULT_PORT else port.toInt()
            this.pin = if (pin.isNullOrEmpty()) null else pin
            server = FinanceHttpServer(reactApplicationContext, portInt, this.pin)
            val ip = server?.localIpAddress()
            val map: WritableMap = Arguments.createMap()
            map.putBoolean("running", server?.isRunning() == true)
            map.putInt("port", portInt)
            map.putString("ipAddress", ip)
            map.putString("baseUrl", if (ip != null) "http://$ip:$portInt" else null)
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("start_failed", e.message, e)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        try {
            stopInternal()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("stop_failed", e.message, e)
        }
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        val map: WritableMap = Arguments.createMap()
        val s = server
        map.putBoolean("running", s?.isRunning() == true)
        map.putInt("port", s?.listeningPort ?: 0)
        map.putString("ipAddress", s?.localIpAddress())
        map.putInt("activeConnections", s?.activeConnectionCount() ?: 0)
        promise.resolve(map)
    }

    @ReactMethod
    fun getConnectionLog(promise: Promise) {
        val s = server
        val log = s?.snapshotLog() ?: emptyList()
        val arr: com.facebook.react.bridge.WritableArray = Arguments.createArray()
        for (rec in log) {
            val m = Arguments.createMap()
            m.putDouble("timestamp", rec.timestampMs.toDouble())
            m.putString("method", rec.method)
            m.putString("path", rec.path)
            m.putInt("status", rec.status)
            m.putString("remoteAddress", rec.remoteAddress)
            arr.pushMap(m)
        }
        promise.resolve(arr)
    }

    @ReactMethod
    fun getLocalIpAddress(promise: Promise) {
        promise.resolve(server?.localIpAddress())
    }

    private fun stopInternal() {
        try {
            server?.stop()
        } catch (_: Exception) {
            // ignore
        }
        server = null
    }

    override fun invalidate() {
        stopInternal()
        super.invalidate()
    }
}