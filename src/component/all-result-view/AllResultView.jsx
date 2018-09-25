import React, {Fragment} from 'react';
import moment from 'moment';
import AmCharts from '@amcharts/amcharts3-react';
import {Bar} from 'react-chartjs';
import GoogleMapReact from 'google-map-react';

import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
import jobApi from '../../api/jobApi';

import * as AppConstants from '../../constants/AppConstants';
import * as UIHelper from '../../common/UIHelper';
import * as MessageConstants from '../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './AllResultViewStyles.less';
/* eslint-enable no-unused-vars */

class AllResultView extends React.Component {
    constructor(props) {
        super(props);

        this.getAllJobs           = this.getAllJobs.bind(this);
        this.redirectToSiteLoad   = this.redirectToSiteLoad.bind(this);
        this.chartDropDownClick   = this.chartDropDownClick.bind(this);
        this.getArrangedBarChartData = this.getArrangedBarChartData.bind(this);
        this.redirectToAddJob     = this.redirectToAddJob.bind(this);
        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Results View - xSum';
    }

    componentWillMount() {

        if (this.props.location.query.userObj) {
            var loggedUserObject = JSON.parse(this.props.location.query.userObj);
            this.setState({loggedUserObj: loggedUserObject});
            this.getAllJobs(loggedUserObject);
        } else {
            UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);
        }

    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isLoading: false,
            loadingMessage: '',
            loggedUserObj: null,
            siteList: [],
            isChartDataArrived: false,
            maxChartData: null,
            minChartData: null,
            meanChartData: null,
            medianChartData: null,
            jobsWithResults: []
        };

        return initialState;
    }

    getAllJobs(loggedUserObj) {
        var urlToGetJobs = AppConstants.API_URL + AppConstants.JOBS_GET_API;
        var urlForResultJob = AppConstants.API_URL + AppConstants.GET_ALL_RESULTS_JOB_API;

        this.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_JOBS});
        jobApi.getAllJobsFrom(urlToGetJobs, {userEmail: loggedUserObj.email}).then((data) => {

            for (var i = 0; i < data.length; i++) {
                var currentJob = data[i];

                jobApi.getResult(urlForResultJob, {jobID: data[i].jobId}).then((jobResult) => {


                    var resultsArr = this.state.jobsWithResults;
                    resultsArr.push({
                        job: currentJob,
                        result: jobResult,
                        selectedChart: AppConstants.CHART_TYPES_ARRAY[0],
                        selectedChartIndex: '0',
                        barChartData: this.getArrangedBarChartData(jobResult, 0)
                    });
                    this.setState({jobsWithResults: resultsArr});
                });

            }

            this.setState({siteList: data, isLoading: false, loadingMessage: ''});
        });
    }

    getArrangedBarChartData(jobResult, selectedChartIndex) {
        var resultArray = [];

        var resultCount = 1;
        for (var i = 0; i < jobResult.length; i++) {

            // Check Result ID exists
            var isResultIdFound = resultArray.find(function(jobObj) {
                return jobObj.resultID === jobResult[i].resultID;
            });

            if (!isResultIdFound) {
                resultArray.push({
                    execution: moment(jobResult[i].time).format(AppConstants.TIME_ONLY_FORMAT),
                    responseTime: jobResult[i][AppConstants.CHART_TYPES_ARRAY[selectedChartIndex].value]/1000,
                    color: '#eb00ff',
                    resultID: jobResult[i].resultID
                });
            }
        }

        return resultArray;
    }

    chartDropDownClick(jobIndex, jobWithResult, selectedChartIndex) {
        var jobsList = this.state.jobsWithResults;
        jobWithResult.selectedChartIndex = selectedChartIndex;
        jobWithResult.selectedChart = AppConstants.CHART_TYPES_ARRAY[selectedChartIndex];
        jobWithResult.barChartData = this.getArrangedBarChartData(jobWithResult.result, selectedChartIndex);
        // Remove old job and add updated job
        jobsList.splice(jobIndex, 1, jobWithResult);
        this.setState({jobsWithResults: jobsList});
    }

    redirectToSiteLoad() {
        UIHelper.redirectTo(AppConstants.SITELOAD_ROUTE,
            {
                userObj: JSON.stringify(this.state.loggedUserObj)
            });
    }

    redirectToAddJob() {
        UIHelper.redirectTo(AppConstants.SITEADD_ROUTE,
            {
                userObj: JSON.stringify(this.state.loggedUserObj)
            });
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            loggedUserObj,
            isChartDataArrived,
            maxChartData,
            minChartData,
            meanChartData,
            medianChartData,
            siteList,
            jobsWithResults
        } = this.state;

        const ResultViewContainer = (props) => {
            const {barChartData} = props.jobWithResult;
            const barChartConfig = {
                color: '#fff',
                type: 'serial',
                theme: 'light',
                dataProvider: barChartData,
                valueAxes: [
                    {
                        gridColor: '#FFFFFF',
                        gridAlpha: 0.2,
                        dashLength: 0
                    }
                ],
                gridAboveGraphs: true,
                startDuration: 1,
                graphs: [
                    {
                        balloonText: '[[category]]: <b>[[value]]</b>',
                        fillAlphas: 0.8,
                        lineAlpha: 0.2,
                        type: 'column',
                        valueField: 'responseTime',
                        fillColorsField: 'color'
                    }
                ],
                chartCursor: {
                    categoryBalloonEnabled: false,
                    cursorAlpha: 0,
                    zoomable: false
                },
                categoryField: 'execution',
                categoryAxis: {
                    gridPosition: 'start',
                    gridAlpha: 0,
                    tickPosition: 'start',
                    tickLength: 20
                },
                export: {
                    enabled: true
                }
            };

            var lastTestAvg = barChartData[barChartData.length-1] && barChartData[barChartData.length-1].responseTime;

            const pieChartConfig = {
                type: 'pie',
                theme: 'light',
                outlineAlpha: 1,
                outlineColor: 'none',
                labelsEnabled: false,
                dataProvider: [
                    {
                        title: 'Average Response Time',
                        value: 3
                    },
                    {
                        title: 'Last Test Average',
                        value: lastTestAvg
                    }
                ],
                colors: [
                    '#222029', '#eb00ff'
                ],
                titleField: 'title',
                valueField: 'value',
                labelRadius: 5,
                radius: '42%',
                innerRadius: '70%',
                labelText: '[[title]]',
                export: {
                    enabled: true
                }
            };

            return (
                <div className="row single-chart">
                    <select className="form-control form-control-sm form-group chart-drop-down"
                        value={props.jobWithResult.selectedChartIndex}
                        onChange={(e) => this.chartDropDownClick(
                            props.keyID,
                            props.jobWithResult,
                            e.target.value)
                        }>
                        {
                            AppConstants.CHART_TYPES_ARRAY.map((chartType, i) => {
                                return (
                                    <option key={'chartType_' + i} value={i}>
                                        {chartType.textValue}
                                    </option>
                                );
                            })
                        }
                    </select>
                    <div className="row">
                        <div className="col-sm-4">
                            <div className="row">
                                <AmCharts.React style={{width: '100%', height: '270px'}} options={pieChartConfig}/>
                            </div>
                            <div className="row pie-chart-heading">
                                Last Test Average
                            </div>
                        </div>
                        <div className="col-sm-8">
                            <AmCharts.React style={{width: '100%', height: '300px'}} options={barChartConfig}/>
                        </div>
                    </div>
                </div>
            );
        };

        const googleMaps = {
            center: {
                lat: 6.927079,
                lng: 79.861244
            },
            zoom: 5
        };

        const LocationMarker = (props) => {
            return (
                <Fragment>
                    <i className="glyphicon glyphicon-map-marker map-marker"/>
                    <h4 className="map-text">{props.text}</h4>
                </Fragment>
            );
        };

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                {
                    (loggedUserObj)
                        ? <NavContainer
                                  loggedUserObj={loggedUserObj}/>
                        : <div className="sign-in-button">
                              <button onClick={() => {UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);}}
                                  className="btn btn-primary btn-sm log-out-drop-down--li--button">
                                  Sign in
                              </button>
                          </div>
                }
                <div className="all-result-view">
                    <div className="row map-container">
                        <GoogleMapReact
                            bootstrapURLKeys={{key: AppConstants.GOOGLE_MAP_KEY}}
                            defaultCenter={googleMaps.center}
                            defaultZoom={googleMaps.zoom}>
                            <LocationMarker
                                lat={6.927079}
                                lng={79.861244}
                                text={'Your Location'}/>
                        </GoogleMapReact>
                    </div>
                    <div className="row chart-view">
                        {
                            (jobsWithResults.length > 0)
                                ? jobsWithResults.map((jobWithResult, i) => {
                                      return <ResultViewContainer jobWithResult={jobWithResult} keyID={i}/>;
                                  })
                                : null
                        }
                    </div>
                    <div className="row add-test-section">
                        <div className="col-sm-4"></div>
                        <div className="col-sm-4 add-test-text" onClick={this.redirectToAddJob}>
                            <div className="row">
                                Add a test
                            </div>
                            <div className="row">
                                <i className="plus-icon glyphicon glyphicon-plus"></i>
                            </div>
                        </div>
                        <div className="col-sm-4"></div>
                    </div>
                </div>
            </Fragment>
        );
    }
}

AllResultView.propTypes = {
};

export default AllResultView;