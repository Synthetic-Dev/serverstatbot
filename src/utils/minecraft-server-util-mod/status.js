"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

Object.defineProperty(exports, "__esModule", {
    value: true
});

const assert_1 = __importDefault(require("assert"));
const Packet_1 = __importDefault(require("minecraft-server-util/dist/structure/Packet"));
const TCPSocket_1 = __importDefault(require("minecraft-server-util/dist/structure/TCPSocket"));
const formatResult_1 = __importDefault(require("minecraft-server-util/dist/util/formatResult"));
const resolveSRV_1 = __importDefault(require("minecraft-server-util/dist/util/resolveSRV"));

const ipAddressRegEx = /^\d{1,3}(\.\d{1,3}){3}$/;

function applyDefaultOptions(options) {
    // Apply the provided options on the default options
    return Object.assign({
        port: 25565,
        protocolVersion: 47,
        timeout: 1000 * 5,
        enableSRV: true
    }, options);
}

/**
 * Retrieves the status of the server using the 1.7+ format.
 * @param {string} host The host of the server
 * @param {StatusOptions} [options] The options to use when retrieving the status
 * @returns {Promise<StatusResponse>} The status information of the server
 * @async
 */
function status(host, options) {
    var _a, _b;
    return new Promise(async (resolve, reject) => {   //__awaiter(this, void 0, void 0, function* () {
        // Applies the provided options on top of the default options
        const opts = applyDefaultOptions(options);
        // Assert that the arguments are the correct type and format
        assert_1.default(typeof host === 'string', `Expected 'host' to be a string, got ${typeof host}`);
        assert_1.default(host.length > 0, 'Expected \'host\' to have content, got an empty string');
        assert_1.default(typeof options === 'object' || typeof options === 'undefined', `Expected 'options' to be an object or undefined, got ${typeof options}`);
        assert_1.default(typeof opts === 'object', `Expected 'options' to be an object, got ${typeof opts}`);
        assert_1.default(typeof opts.port === 'number', `Expected 'options.port' to be a number, got ${typeof opts.port}`);
        assert_1.default(opts.port > 0, `Expected 'options.port' to be greater than 0, got ${opts.port}`);
        assert_1.default(opts.port < 65536, `Expected 'options.port' to be less than 65536, got ${opts.port}`);
        assert_1.default(Number.isInteger(opts.port), `Expected 'options.port' to be an integer, got ${opts.port}`);
        assert_1.default(typeof opts.protocolVersion === 'number', `Expected 'options.protocolVersion' to be a number, got ${typeof opts.protocolVersion}`);
        assert_1.default(opts.protocolVersion >= 0, `Expected 'options.protocolVersion' to be greater than or equal to 0, got ${opts.protocolVersion}`);
        assert_1.default(Number.isInteger(opts.protocolVersion), `Expected 'options.protocolVersion' to be an integer, got ${opts.protocolVersion}`);
        assert_1.default(typeof opts.timeout === 'number', `Expected 'options.timeout' to be a number, got ${typeof opts.timeout}`);
        assert_1.default(opts.timeout > 0, `Expected 'options.timeout' to be greater than 0, got ${opts.timeout}`);
        assert_1.default(typeof opts.enableSRV === 'boolean', `Expected 'options.enableSRV' to be a boolean, got ${typeof opts.enableSRV}`);

        let srvRecord = null;
        let socket = null;

        let timeout
        timeout = setTimeout(() => {
            if (socket) socket.destroy();

            reject(new Error("Failed to retrieve the status of the server within time"))
            clearTimeout(timeout)
        }, opts.timeout)

        // Automatically resolve from host (e.g. play.hypixel.net) into a connect-able address
        if (opts.enableSRV && !ipAddressRegEx.test(host)) {
            srvRecord = await resolveSRV_1.default(host);
        }

        const startTime = Date.now();
        
        try {
            // Create a new TCP connection to the specified address
            socket = await TCPSocket_1.default.connect((_a = srvRecord === null || srvRecord === void 0 ? void 0 : srvRecord.host) !== null && _a !== void 0 ? _a : host, (_b = srvRecord === null || srvRecord === void 0 ? void 0 : srvRecord.port) !== null && _b !== void 0 ? _b : opts.port, opts.timeout);

            // Create the necessary packets and send them to the server
            {
                // https://wiki.vg/Server_List_Ping#Handshake
                const handshakePacket = new Packet_1.default();
                handshakePacket.writeVarInt(0x00);
                handshakePacket.writeVarInt(opts.protocolVersion);
                handshakePacket.writeString(host, true);
                handshakePacket.writeUShortBE(opts.port);
                handshakePacket.writeVarInt(1);
                socket.writePacket(handshakePacket, true);

                // https://wiki.vg/Server_List_Ping#Request
                const requestPacket = new Packet_1.default();
                requestPacket.writeVarInt(0x00);
                socket.writePacket(requestPacket, true);
            }

            // https://wiki.vg/Server_List_Ping#Response
            const responsePacket = await Packet_1.default.from(socket);
            const packetType = responsePacket.readVarInt();

            // Packet was unexpected type, ignore the rest of the data in this packet
            if (packetType !== 0) reject(new Error('Server sent an invalid packet type'));

            // Convert the raw JSON string provided by the server into a JavaScript object
            let result;
            try {
                result = JSON.parse(responsePacket.readString());
            }
            catch (e) {
                reject(new Error('Response from server is not valid JSON'))
            }

            // Convert the data from raw Minecraft status payload format into a more human readable format and resolve the promise
            resolve(formatResult_1.default(host, opts.port, srvRecord, result, Date.now() - startTime));
        }

        catch (e) {
            reject(new Error("Failed to retrieve the status of the server"))
        }

        finally {
            // Destroy the socket, it is no longer needed
            if (socket) socket.destroy();
            clearTimeout(timeout)
        }
    });
}
exports.default = status;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3N0YXR1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLG9EQUE0QjtBQUM1QixnRUFBd0M7QUFDeEMsc0VBQThDO0FBQzlDLHVFQUErQztBQUMvQyxtRUFBMEQ7QUFLMUQsTUFBTSxjQUFjLEdBQUcseUJBQXlCLENBQUM7QUFFakQsU0FBUyxtQkFBbUIsQ0FBQyxPQUF1QjtJQUNuRCxvREFBb0Q7SUFDcEQsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ3BCLElBQUksRUFBRSxLQUFLO1FBQ1gsZUFBZSxFQUFFLEVBQUU7UUFDbkIsT0FBTyxFQUFFLElBQUksR0FBRyxDQUFDO1FBQ2pCLFNBQVMsRUFBRSxJQUFJO0tBQ1ksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUN4QyxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBOEIsTUFBTSxDQUFDLElBQVksRUFBRSxPQUF1Qjs7O1FBQ3pFLDZEQUE2RDtRQUM3RCxNQUFNLElBQUksR0FBRyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUUxQyw0REFBNEQ7UUFDNUQsZ0JBQU0sQ0FBQyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsdUNBQXVDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN2RixnQkFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLHdEQUF3RCxDQUFDLENBQUM7UUFDbEYsZ0JBQU0sQ0FBQyxPQUFPLE9BQU8sS0FBSyxRQUFRLElBQUksT0FBTyxPQUFPLEtBQUssV0FBVyxFQUFFLHdEQUF3RCxPQUFPLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDaEosZ0JBQU0sQ0FBQyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsMkNBQTJDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMzRixnQkFBTSxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsK0NBQStDLE9BQU8sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDekcsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsRUFBRSxxREFBcUQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDeEYsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssRUFBRSxzREFBc0QsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDN0YsZ0JBQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxpREFBaUQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDbEcsZ0JBQU0sQ0FBQyxPQUFPLElBQUksQ0FBQyxlQUFlLEtBQUssUUFBUSxFQUFFLDBEQUEwRCxPQUFPLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO1FBQzFJLGdCQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsSUFBSSxDQUFDLEVBQUUsNEVBQTRFLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO1FBQ3RJLGdCQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsNERBQTRELElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO1FBQ25JLGdCQUFNLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxLQUFLLFFBQVEsRUFBRSxrREFBa0QsT0FBTyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNsSCxnQkFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxFQUFFLHdEQUF3RCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNqRyxnQkFBTSxDQUFDLE9BQU8sSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLEVBQUUscURBQXFELE9BQU8sSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFFMUgsSUFBSSxTQUFTLEdBQXFCLElBQUksQ0FBQztRQUV2QyxzRkFBc0Y7UUFDdEYsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNqRCxTQUFTLEdBQUcsTUFBTSxvQkFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ25DO1FBRUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRTdCLHVEQUF1RDtRQUN2RCxNQUFNLE1BQU0sR0FBRyxNQUFNLG1CQUFTLENBQUMsT0FBTyxPQUFDLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLG1DQUFJLElBQUksUUFBRSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxtQ0FBSSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUU1RyxJQUFJO1lBQ0gsMkRBQTJEO1lBQzNEO2dCQUNDLDZDQUE2QztnQkFDN0MsTUFBTSxlQUFlLEdBQUcsSUFBSSxnQkFBTSxFQUFFLENBQUM7Z0JBQ3JDLGVBQWUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2xDLGVBQWUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUNsRCxlQUFlLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDeEMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3pDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9CLE1BQU0sQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUUxQywyQ0FBMkM7Z0JBQzNDLE1BQU0sYUFBYSxHQUFHLElBQUksZ0JBQU0sRUFBRSxDQUFDO2dCQUNuQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUN4QztZQUVELDRDQUE0QztZQUM1QyxNQUFNLGNBQWMsR0FBRyxNQUFNLGdCQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pELE1BQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUUvQyx5RUFBeUU7WUFDekUsSUFBSSxVQUFVLEtBQUssQ0FBQztnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7WUFFNUUsOEVBQThFO1lBQzlFLElBQUksTUFBeUIsQ0FBQztZQUU5QixJQUFJO2dCQUNILE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO2FBQ2pEO1lBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ1gsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO2FBQzFEO1lBRUQsc0hBQXNIO1lBQ3RILE9BQU8sc0JBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQztTQUNoRjtnQkFBUztZQUNULDZDQUE2QztZQUM3QyxNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUN2Qjs7Q0FDRDtBQXhFRCx5QkF3RUMifQ==