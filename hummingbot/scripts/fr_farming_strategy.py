from hummingbot.strategy.script_strategy_base import ScriptStrategyBase

class SimplePMM(ScriptStrategyBase):
    bid_spread = 0.01
    ask_spread = 0.01
    order_refresh_time = 15
    order_amount = 0.01

    markets = {"binance_paper_trade": {"BTC-USDT"}}

    def on_tick(self):
        connector = self.connectors["binance_paper_trade"]
        mid_price = connector.get_mid_price("BTC-USDT")
        if not mid_price:
            return
        bid_price = mid_price * (1 - self.bid_spread)
        ask_price = mid_price * (1 + self.ask_spread)
        self.cancel_all_orders()
        self.buy(
            connector_name="binance_paper_trade",
            trading_pair="BTC-USDT",
            amount=self.order_amount,
            order_type=OrderType.LIMIT,
            price=bid_price,
        )
        self.sell(
            connector_name="binance_paper_trade",
            trading_pair="BTC-USDT",
            amount=self.order_amount,
            order_type=OrderType.LIMIT,
            price=ask_price,
        )

    def on_status(self) -> str:
        return f"Mid Price: {self.connectors['binance_paper_trade'].get_mid_price('BTC-USDT')}"
