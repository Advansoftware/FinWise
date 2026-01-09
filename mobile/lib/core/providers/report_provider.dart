// lib/core/providers/report_provider.dart

import 'package:flutter/foundation.dart';
import '../models/report_model.dart';
import '../models/transaction_model.dart';
import '../services/report_service.dart';
import '../services/api_service.dart';

/// Provider para gerenciamento de relatórios
class ReportProvider extends ChangeNotifier {
  final ReportService _reportService;
  
  List<ReportModel> _reports = [];
  bool _isLoading = false;
  String? _error;

  ReportProvider() : _reportService = ReportService(ApiService());

  List<ReportModel> get reports => _reports;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Gera relatório mensal
  ReportModel generateMonthlyReport({
    required String userId,
    required int year,
    required int month,
    required List<TransactionModel> transactions,
  }) {
    return _reportService.generateMonthlyReport(
      userId: userId,
      year: year,
      month: month,
      transactions: transactions,
    );
  }

  /// Gera relatório anual
  ReportModel generateAnnualReport({
    required String userId,
    required int year,
    required List<TransactionModel> transactions,
  }) {
    return _reportService.generateAnnualReport(
      userId: userId,
      year: year,
      transactions: transactions,
    );
  }

  /// Carrega relatórios do servidor
  Future<void> loadReports({String? type, String? period}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _reports = await _reportService.fetchReports(type: type, period: period);
    } catch (e) {
      _error = e.toString();
      debugPrint('Erro ao carregar relatórios: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Obtém relatório mensal do cache ou gera um novo
  ReportModel? getMonthlyReport(int year, int month) {
    final period = '$year-${month.toString().padLeft(2, '0')}';
    try {
      return _reports.firstWhere(
        (r) => r.type == 'monthly' && r.period == period,
      );
    } catch (_) {
      return null;
    }
  }

  /// Obtém relatório anual do cache ou gera um novo
  ReportModel? getAnnualReport(int year) {
    final period = year.toString();
    try {
      return _reports.firstWhere(
        (r) => r.type == 'annual' && r.period == period,
      );
    } catch (_) {
      return null;
    }
  }

  /// Salva relatório no servidor
  Future<bool> saveReport(ReportModel report) async {
    try {
      final success = await _reportService.saveReport(report);
      if (success) {
        // Atualiza o cache local
        final index = _reports.indexWhere(
          (r) => r.type == report.type && r.period == report.period,
        );
        if (index >= 0) {
          _reports[index] = report;
        } else {
          _reports.add(report);
        }
        notifyListeners();
      }
      return success;
    } catch (e) {
      debugPrint('Erro ao salvar relatório: $e');
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
