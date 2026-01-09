// lib/core/services/report_service.dart

import 'package:flutter/foundation.dart';
import '../models/report_model.dart';
import '../models/transaction_model.dart';
import 'api_service.dart';

/// Serviço para gerenciamento de relatórios financeiros
class ReportService {
  final ApiService _apiService;

  ReportService(this._apiService);

  /// Busca relatórios do servidor
  Future<List<ReportModel>> fetchReports({String? type, String? period}) async {
    try {
      final result = await _apiService.getList<ReportModel>(
        '/reports',
        (json) => ReportModel.fromJson(json),
        queryParams: {
          if (type != null) 'type': type,
          if (period != null) 'period': period,
        },
      );

      if (result.isSuccess && result.data != null) {
        return result.data!;
      }
      return [];
    } catch (e) {
      debugPrint('Erro ao buscar relatórios: $e');
      return [];
    }
  }

  /// Gera relatório mensal a partir das transações
  ReportModel generateMonthlyReport({
    required String userId,
    required int year,
    required int month,
    required List<TransactionModel> transactions,
  }) {
    final period = '$year-${month.toString().padLeft(2, '0')}';
    
    // Filtra transações do mês
    final monthlyTransactions = transactions.where((t) {
      return t.date.year == year && t.date.month == month;
    }).toList();

    final transactionMaps = monthlyTransactions.map((t) => t.toJson()).toList();

    return ReportModel.generateFromTransactions(
      userId: userId,
      type: 'monthly',
      period: period,
      transactions: transactionMaps,
    );
  }

  /// Gera relatório anual a partir das transações
  ReportModel generateAnnualReport({
    required String userId,
    required int year,
    required List<TransactionModel> transactions,
  }) {
    final period = year.toString();
    
    // Filtra transações do ano
    final yearlyTransactions = transactions.where((t) {
      return t.date.year == year;
    }).toList();

    final transactionMaps = yearlyTransactions.map((t) => t.toJson()).toList();

    // Gera dados mensais
    final monthlyData = <MonthlyData>[];
    final monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    for (int m = 1; m <= 12; m++) {
      final monthTransactions = yearlyTransactions.where((t) {
        return t.date.month == m;
      }).toList();

      double income = 0;
      double expense = 0;
      
      for (final t in monthTransactions) {
        if (t.type == TransactionType.income) {
          income += t.amount;
        } else if (t.type == TransactionType.expense) {
          expense += t.amount;
        }
      }

      monthlyData.add(MonthlyData(
        month: m,
        monthName: monthNames[m - 1],
        income: income,
        expense: expense,
        balance: income - expense,
        transactionCount: monthTransactions.length,
      ));
    }

    // Gera o relatório base
    final baseReport = ReportModel.generateFromTransactions(
      userId: userId,
      type: 'annual',
      period: period,
      transactions: transactionMaps,
    );

    // Retorna com dados mensais
    return ReportModel(
      id: baseReport.id,
      userId: baseReport.userId,
      type: 'annual',
      period: period,
      summary: baseReport.summary,
      categoryBreakdown: baseReport.categoryBreakdown,
      monthlyData: monthlyData,
      generatedAt: baseReport.generatedAt,
    );
  }

  /// Salva relatório no servidor
  Future<bool> saveReport(ReportModel report) async {
    try {
      final result = await _apiService.post<Map<String, dynamic>>(
        '/reports',
        report.toJson(),
        (data) => data,
      );
      return result.isSuccess;
    } catch (e) {
      debugPrint('Erro ao salvar relatório: $e');
      return false;
    }
  }
}
