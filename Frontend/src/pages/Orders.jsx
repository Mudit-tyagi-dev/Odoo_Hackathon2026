import React from "react";
import { ShoppingBag, FileText, ChevronRight, Ban, CheckCircle2, Truck } from "lucide-react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

export const Orders = ({ orders, onOpenDeleteModal, onSelectQuotationById }) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600">
          WORKSPACE
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
          Orders
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track confirmed quotations and fulfillment progress
        </p>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[680px]">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3.5 px-6">ORDER</th>
                <th className="py-3.5 px-6">QUOTATION</th>
                <th className="py-3.5 px-6">DATE</th>
                <th className="py-3.5 px-6">TOTAL</th>
                <th className="py-3.5 px-6">STATUS</th>
                <th className="py-3.5 px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No confirmed orders yet. Once a quotation is accepted, its generated sales order will appear here.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition">
                  {/* Order ID & Items */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-slate-900 block">
                          {order.id}
                        </span>
                        <span className="text-slate-400 text-[11px] block mt-0.5">
                          {order.itemsCount} items · {order.fulfillmentStage || "In Fulfillment"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Linked Quotation */}
                  <td className="py-4 px-6">
                    <button
                      onClick={() => onSelectQuotationById(order.quotationId)}
                      className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{order.quotationId}</span>
                    </button>
                  </td>

                  {/* Order Date */}
                  <td className="py-4 px-6 text-slate-600 font-medium">
                    {order.date}
                  </td>

                  {/* Total Value */}
                  <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                    ₹{order.total?.toLocaleString("en-IN")}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-6">
                    <Badge variant={order.status}>{order.status}</Badge>
                  </td>

                  {/* Action - Test Blocked Deletion on Confirmed Order */}
                  <td className="py-4 px-6 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onOpenDeleteModal({
                          id: order.id,
                          status: order.status,
                          salesRep: "Sales & Operations Team",
                          total: order.total,
                        })
                      }
                      className="text-xs text-red-600 hover:bg-red-50"
                      title="Test cancellation validation on active order"
                    >
                      <Ban className="w-3.5 h-3.5 mr-1" />
                      <span>Cancel PO</span>
                    </Button>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
