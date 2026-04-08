import MetaTrader5 as mt5
import time

# -------- ACCOUNT DETAILS --------
account = 279391885     # apna account id
password = "Narendra@90"
server = "Exness-MT5Trial8" 

# -------- LOGIN --------
if not mt5.initialize():
    print("MT5 initialize failed")
    quit()
    

if not mt5.login(account, password=password, server=server):
    print("Login failed")
    quit()

print("Connected to account")

# -------- SETTINGS --------
symbol = "BTCUSD"
lot = 0.01
magic = 10001

mt5.symbol_select(symbol, True)


# -------- CHECK OPEN POSITION --------
def check_position():

    positions = mt5.positions_get(symbol=symbol)

    if positions is None:
        return False

    if len(positions) > 0:
        return True

    return False


# -------- BUY FUNCTION --------
# def buy():

#     price = mt5.symbol_info_tick(symbol).ask

#     request = {
#         "action": mt5.TRADE_ACTION_DEAL,
#         "symbol": symbol,
#         "volume": lot,
#         "type": mt5.ORDER_TYPE_BUY,
#         "price": price,
#         "deviation": 20,
#         "magic": magic,
#         "comment": "Python Buy",
#         "type_time": mt5.ORDER_TIME_GTC,
#         "type_filling": mt5.ORDER_FILLING_IOC
#     }

#     result = mt5.order_send(request)

#     print("BUY ORDER:", result)


# -------- SELL FUNCTION --------
def sell():

    price = mt5.symbol_info_tick(symbol).bid

    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": lot,
        "type": mt5.ORDER_TYPE_SELL,
        "price": price,
        "deviation": 20,
        "magic": magic,
        "comment": "Python Sell",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC
    }

    result = mt5.order_send(request)

    print("SELL ORDER:", result)


# -------- BOT LOOP --------
while True:

    tick = mt5.symbol_info_tick(symbol)

    if tick is None:
        print("No data")
        time.sleep(5)
        continue

    bid = tick.bid
    ask = tick.ask

    print("Bid:", bid, "Ask:", ask)

    # ---- Check open trade ----
    if check_position():
        print("Trade already open")
        time.sleep(5)
        continue


    # ===== STRATEGY AREA =====
    # YAHI PAR STRATEGY CHANGE KARNA HAI

    # if ask > 2050:
    #     buy()

    elif bid < 2000:
        sell()

    # ===== END STRATEGY =====


    time.sleep(5)